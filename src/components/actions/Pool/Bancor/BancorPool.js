import React, { Component } from 'react'
import { Form } from "react-bootstrap"
import { CoTraderBancorEndPoint } from '../../../../config.js'
import axios from 'axios'
import { Typeahead } from 'react-bootstrap-typeahead'

import BuyPool from './BuyPool'
import BuyV2Pool from './BuyV2Pool'
import SellPool from './SellPool'
import SellV2Pool from './SellV2Pool'

// Select v1 or v2 dependse of smart fund and converter versions
// Note smart funds version < 7 not support Bancor v2
const getComponentList = (converterType) => {
  return {
    Buy: converterType ? converterType === 2 ? BuyV2Pool : BuyPool : BuyPool,
    Sell: converterType ? converterType === 2 ? SellV2Pool : SellPool : SellPool,
  }
}

class BancorPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      symbols: [],
      smartTokenSymbols: [],
      tokensObject: null,
      action: 'Buy',
      fromAddress:undefined,
      converterAddress:undefined,
      converterVersion:undefined,
      converterType:0,
      poolSourceTokenAddress:undefined
    }
  }

  _isMounted = false
  componentDidMount(){
    this._isMounted = true
    this.initData()

  }

  componentWillUnmount(){
    this._isMounted = false
  }

  // Find Bancor relay address by symbol
  findAddressBySymbol = (symbol) => {
    let address
    const res = this.state.tokensObject.filter(item => item['smartTokenSymbol'] === symbol)

    if(res && res.length > 0 && res[0].hasOwnProperty('smartTokenAddress')){
      address = res[0].smartTokenAddress
    }else{
      address = null
    }
    return address
  }


  // Update states by symbol select
  updateDataBySymbolSelect = (symbol) => {
    const fromAddress = this.findAddressBySymbol(symbol)
    const tokenData = this.state.tokensObject.filter(item => item['smartTokenAddress'] === fromAddress)
    const converterVersion = Number(tokenData[0].converterVersion).toFixed()
    const converterType = Number(tokenData[0].converterType).toFixed()
    const poolSourceTokenAddress = tokenData[0].tokenAddress
    const converterAddress = tokenData[0].converterAddress

    this.setState({
      fromAddress,
      converterVersion,
      converterType,
      converterAddress,
      poolSourceTokenAddress
    })
  }

  // init data from cotrader bancor api
  initData = async () => {
    const res = await axios.get(CoTraderBancorEndPoint + 'official')
    const tokensObject = res.data.result
    const symbols = res.data.result.map(item => item.symbol)
    const smartTokenSymbols = res.data.result.map(item => item.smartTokenSymbol)

    if(this._isMounted)
      this.setState({ tokensObject, symbols, smartTokenSymbols })
  }



  findTokenAddressBySmartTokenSymbol = (symbol) => {
    const tokenObj = this.state.tokensObject.find((item) => item.smartTokenSymbol && item.smartTokenSymbol === symbol)
    if(tokenObj){
      return String(tokenObj.tokenAddress).toLowerCase()
    }else{
      return null
    }
  }

  render() {
    // Change component (Buy/Sell/Swap) dynamicly
    let CurrentAction
    const componentList = getComponentList(this.state.converterType)

    if(this.state.action in componentList){
      CurrentAction = componentList[this.state.action]
    }else{
      // alert('Wrong name for component action')
      CurrentAction = componentList['Buy']
    }

    return (
      <React.Fragment>
        <Form>
          <Form.Group>
          <Form.Label>Selet action for Bancor pool</Form.Label>
          <Form.Control
            as="select"
            size="sm"
            name="selectAction"
            onChange={(e) => this.setState({ action:e.target.value })}>
            {/* NOTE: render of actions components dependse of this actions*/}
            <option>Buy</option>
            <option>Sell</option>
            </Form.Control>
            </Form.Group>
           </Form>
            {
              this.state.symbols.length === 0 ? <small>Loading data from Bancor...</small> : null
            }

            <Typeahead
               labelKey="symbols"
               multiple={false}
               id="symbols"
               options={this.state.smartTokenSymbols}
               onChange={(s) => { if(s[0]) this.updateDataBySymbolSelect(s[0]) } }
               placeholder="Choose a symbol"
               renderMenuItemChildren={(options, props) => (
                 <div>
                   <img
                   style={{height: "35px", width: "35px"}}
                   src={`https://tokens.1inch.exchange/${this.findTokenAddressBySmartTokenSymbol(options)}.png`}
                   alt="Logo"
                   onError={(e)=>{e.target.onerror = null; e.target.src="https://etherscan.io/images/main/empty-token.png"}}
                   />
                   &nbsp; &nbsp;
                   {options}
                 </div>
               )}
             />
             <br/>
             <CurrentAction
               tokenData={this.state.tokensObject}
               fromAddress={this.state.fromAddress}
               converterAddress={this.state.converterAddress}
               web3={this.props.web3}
               accounts={this.props.accounts}
               smartFundAddress={this.props.smartFundAddress}
               pending={this.props.pending}
               modalClose={this.props.modalClose}
               converterVersion={this.state.converterVersion}
               converterType={this.state.converterType}
               poolSourceTokenAddress={this.state.poolSourceTokenAddress}
               version={this.props.version}
               findAddressBySymbol={this.findAddressBySymbol}
               symbols={this.state.symbols}
             />
      </React.Fragment>
    )
  }
}

export default BancorPool

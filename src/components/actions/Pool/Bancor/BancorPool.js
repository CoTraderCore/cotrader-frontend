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
const getComponentList = (isV2) => {
  return {
    Buy: isV2 ? BuyV2Pool : BuyPool,
    Sell: isV2 ? SellV2Pool : SellPool,
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
      fromAddress:'',
      isV2:false
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

  // Get Bancor converter version by relay address
  getConverterVersion = (address) => {
    const tokenData = this.state.tokensObject.filter(item => item['smartTokenAddress'] === address)
    console.log(tokenData, tokenData[0].converterVersion)
    return Number(tokenData[0].converterVersion)
  }

  // Update states by symbol select
  updateDataBySymbolSelect = (symbol) => {
    const fromAddress = this.findAddressBySymbol(symbol)
    const coneverterVersion = this.getConverterVersion(fromAddress)

    // true if smartfund version > 6 and converter >= 28
    const isV2 = this.props.version > 6 && coneverterVersion >= 28 ? true : false
    this.setState({ fromAddress, isV2 })
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


  render() {
    // Change component (Buy/Sell/Swap) dynamicly
    let CurrentAction
    const componentList = getComponentList(this.state.isV2)

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
            {
              this.state.action !== 'Swap'
              ?
              (
                <React.Fragment>
                <Typeahead
                   labelKey="symbols"
                   multiple={false}
                   id="symbols"
                   options={this.state.smartTokenSymbols}
                   onChange={(s) => { if(s[0]) this.updateDataBySymbolSelect(s[0]) } }
                   placeholder="Choose a symbol"
                 />
                 <br/>
                 <CurrentAction
                   fromAddress={this.state.fromAddress}
                   web3={this.props.web3}
                   accounts={this.props.accounts}
                   smartFundAddress={this.props.smartFundAddress}
                   pending={this.props.pending}
                   modalClose={this.props.modalClose}
                 />
               </React.Fragment>
              )
              :
              (
                <CurrentAction
                  tokensObject={this.state.tokensObject}
                  smartTokenSymbols={this.state.smartTokenSymbols}
                  symbols={this.state.symbols}
                  findAddressBySymbol={this.findAddressBySymbol}
                  web3={this.props.web3}
                  accounts={this.props.accounts}
                  smartFundAddress={this.props.smartFundAddress}
                  pending={this.props.pending}
                  modalClose={this.props.modalClose}
                  version={this.props.version}
                />
              )
           }
      </React.Fragment>
    )
  }
}

export default BancorPool

import React, { Component } from 'react'
import { Form } from "react-bootstrap"
import {
  CoTraderBancorEndPoint,
  BNTToken,
  BNTEther,
  BNTUSDBToken,
  NeworkID
} from '../../../../config.js'
import axios from 'axios'

import { Typeahead } from 'react-bootstrap-typeahead'

import BuyPool from './BuyPool'
import SellPool from './SellPool'
import SwapPool from './SwapPool'

const componentList = {
  Buy: BuyPool,
  Sell: SellPool,
  Swap: SwapPool
}

class BancorPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      symbols: [],
      smartTokenSymbols: [],
      tokensObject: null,
      action: 'Buy',
      fromAddress:''
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

  // Find ERC20 or Relay address by symbol
  findAddressBySymbol = (symbol, isFromERC20=false) =>{
    let result
    if(symbol === "ETH"){
      result = BNTEther
    }
    else if(symbol === "BNT"){
      result = BNTToken
    }
    else if(symbol === "USDB"){
      result = BNTUSDBToken
    }
    else{
      // Parse tokens object
      const column = isFromERC20 ? 'symbol' : 'smartTokenSymbol'
      const property = isFromERC20 ? 'tokenAddress' : 'smartTokenAddress'
      const res = this.state.tokensObject.filter(item => item[column] === symbol)

      if(res && res.length > 0 && res[0].hasOwnProperty(property)){
        result = res[0][property]
      }else{
        result = null
      }
    }

    return result
  }

  initData = async () => {
    const res = await axios.get(CoTraderBancorEndPoint + 'official')
    const tokensObject = res.data.result
    const symbols = res.data.result.map(item => item.symbol)

    // PUSH ETH and BNT for Ropsten case, because Ropsten API don't have
    if(NeworkID === 3){
      symbols.push('ETH')
      symbols.push('BNT')
    }else{
      symbols.push('USDB')
    }

    const smartTokenSymbols = res.data.result.map(item => item.smartTokenSymbol)
    if(this._isMounted)
    this.setState({ tokensObject, symbols, smartTokenSymbols })
  }


  render() {
    // Change component (Buy/Sell/Swap) dynamicly
    let CurrentAction
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
            <option>Swap</option>
            </Form.Control>
            </Form.Group>
           </Form>
            {
              this.state.action !== 'Swap'
              ?
              (
                <React.Fragment>
                <Typeahead
                   labelKey="smartTokenSymbols"
                   multiple={false}
                   id="smartTokenSymbols"
                   options={this.state.smartTokenSymbols}
                   onChange={(s) => this.setState({fromAddress: this.findAddressBySymbol(s[0])})}
                   placeholder="Choose a symbol"
                 />
                 <br/>
                 <CurrentAction
                   fromAddress={this.state.fromAddress}
                   web3={this.props.web3}
                   accounts={this.props.accounts}
                   smartFundAddress={this.props.smartFundAddress}
                   pending={this.props.pending}
                 />
               </React.Fragment>
              )
              :
              (
                <CurrentAction
                  smartTokenSymbols={this.state.smartTokenSymbols}
                  symbols={this.state.symbols}
                  findAddressBySymbol={this.findAddressBySymbol}
                  web3={this.props.web3}
                  accounts={this.props.accounts}
                  smartFundAddress={this.props.smartFundAddress}
                  pending={this.props.pending}
                />
              )
           }
      </React.Fragment>
    )
  }
}

export default BancorPool

import React, { Component } from 'react'
import { Form, Button, Alert } from "react-bootstrap"
import {
  SmartFundABIV3,
  PoolPortalABI,
  PoolPortal,
  ERC20ABI,
  EtherscanLink
} from '../../../config.js'
import { fromWeiByDecimalsInput } from '../../../utils/weiByDecimals'
import { toWei } from 'web3-utils'
import Pending from '../../templates/Spiners/Pending'


class BuyPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0,
      bancorAmount:0,
      connectorAmount:0,
      bancorAmountFromWei:0,
      connectorAmountFromWei:0,
      curentBalanceBNT:0,
      currentBalanceERC:0,
      isBNTEnough:false,
      isERCEnough:false,
      BNTConnectorSymbol:'',
      ERCConnectorSymbol:'',
      BNTConnector:'',
      ERCConnector:'',
      RelaySymbol:'',
      isСalculate: false,
      showInfo:false
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.fromAddress !== this.props.fromAddress || prevState.amount !== this.state.amount){
      this.resetInfo()
    }
  }

  calculatePool = async () => {
    if(this.props.fromAddress.length > 0 && this.state.amount > 0){
     this.setState({ isСalculate:true })
     const web3 = this.props.web3
     // get current reserve amount for pool
     const poolPortal = new web3.eth.Contract(PoolPortalABI, PoolPortal)

     const { bancorAmount, connectorAmount } = await poolPortal.methods.getBancorConnectorsAmountByRelayAmount(
       toWei(String(this.state.amount)),
       this.props.fromAddress
     ).call()

     // check curent balance
     const { BNTConnector, ERCConnector } = await poolPortal.methods.getBancorConnectorsByRelay(
       this.props.fromAddress
     ).call()

     // get token contracts instance
     const bntToken = new web3.eth.Contract(ERC20ABI, BNTConnector)
     const ercToken = new web3.eth.Contract(ERC20ABI, ERCConnector)

     // get balances
     const bntBalance = await bntToken.methods.balanceOf(this.props.smartFundAddress).call()
     const ercBalance = await ercToken.methods.balanceOf(this.props.smartFundAddress).call()

     // convert from wei current reserve amount
     const bancorAmountFromWei = fromWeiByDecimalsInput(18, bancorAmount)
     const ercDecimals = await ercToken.methods.decimals().call()
     const connectorAmountFromWei = fromWeiByDecimalsInput(ercDecimals, connectorAmount)

     // convert from wei curent banlance
     const curentBalanceBNT = bntBalance > 0 ? fromWeiByDecimalsInput(18, bntBalance) : 0
     const currentBalanceERC = ercBalance > 0 ? fromWeiByDecimalsInput(ercDecimals, ercBalance) : 0
     console.log(currentBalanceERC)

     // compare balance
     const isBNTEnough = curentBalanceBNT >= bancorAmountFromWei ? true : false
     const isERCEnough = currentBalanceERC >= connectorAmountFromWei ? true : false

     // get additional info
     const BNTConnectorSymbol = await this.getTokenSymbol(bntToken)
     const ERCConnectorSymbol = await this.getTokenSymbol(ercToken)
     const relay = new web3.eth.Contract(ERC20ABI, this.props.fromAddress)
     const RelaySymbol = await this.getTokenSymbol(relay)

     // update state
     this.setState({
       bancorAmount,
       connectorAmount,
       bancorAmountFromWei,
       connectorAmountFromWei,
       curentBalanceBNT,
       currentBalanceERC,
       isBNTEnough,
       isERCEnough,
       BNTConnectorSymbol,
       ERCConnectorSymbol,
       BNTConnector,
       ERCConnector,
       RelaySymbol,
       isСalculate:false,
       showInfo:true
      })
    }
    else{
     alert('Please fill in all fields')
    }
  }

  buy = () => {
    if(this.state.isBNTEnough && this.state.isERCEnough){
      const web3 = this.props.web3
      const fund = new web3.eth.Contract(SmartFundABIV3, this.props.smartFundAddress)
      fund.methods.buyPool(
        toWei(String(this.state.amount)),
        0,
        this.props.fromAddress,
        [])
        .send({ from:this.props.accounts[0] })
    }else{
      alert('Your smart fund do not have enough reserve')
    }
  }

  // param ERC20 token instance
  getTokenSymbol = async (token) => {
    let symbol
    try{
      symbol = await token.methods.symbol().call()
    }catch(e){
      symbol = "Connector Token"
    }

    return symbol
  }

  resetInfo = () => {
    this.setState({
      bancorAmount:0,
      connectorAmount:0,
      bancorAmountFromWei:0,
      connectorAmountFromWei:0,
      curentBalanceBNT:0,
      currentBalanceERC:0,
      isBNTEnough:false,
      isERCEnough:false,
      BNTConnectorSymbol:'',
      ERCConnectorSymbol:'',
      BNTConnector:'',
      ERCConnector:'',
      RelaySymbol:'',
      isСalculate:false,
      showInfo:false
     })
  }

  render() {
    return (
      <React.Fragment>
      <Form.Control
      placeholder="Enter amount for send"
      name="amount"
      onChange={(e) => this.setState({ amount: e.target.value })}
      type="number" min="1"/>
      <br/>
      <Button variant="outline-primary" onClick={() => this.calculatePool()}>Calculate</Button>
      {
        this.state.isBNTEnough && this.state.isERCEnough
        ?
        (
          <Button variant="outline-primary" onClick={() => this.buy()}>Buy</Button>
        )
        :null
      }
      <br/>
      <br/>
      {
        this.state.showInfo
        ?
        (
          <React.Fragment>
          <Alert variant="warning">
          You will stake
          <hr/>
          <a href={EtherscanLink + "address/" + this.state.BNTConnector} target="_blank" rel="noopener noreferrer">{this.state.BNTConnectorSymbol}</a>
          &#8194;:&#8194;
          {Number(this.state.bancorAmountFromWei).toFixed()}
          <hr/>
          <a href={EtherscanLink + "address/" + this.state.ERCConnector} target="_blank" rel="noopener noreferrer">{this.state.ERCConnectorSymbol}</a>
          &#8194;:&#8194;
          {Number(this.state.connectorAmountFromWei).toFixed()}
          <hr/>
          You will recieve
          <hr/>
          <a href={EtherscanLink + "address/" + this.props.fromAddress} target="_blank" rel="noopener noreferrer">{this.state.RelaySymbol}</a>
          &#8194;:&#8194;
          { this.state.amount }
          </Alert>
          {
            !this.state.isBNTEnough && !this.state.isERCEnough
            ?
            (
              <Alert variant="danger">
              You don't have enough balance
              <hr/>
              <small>
              Your balance is
              <hr/>
              {this.state.BNTConnectorSymbol}:&#8194;{Number(this.state.curentBalanceBNT).toFixed()}
              <hr/>
              {this.state.ERCConnectorSymbol}:&#8194;{Number(this.state.currentBalanceERC).toFixed()}
              <hr/>
              Note: please use exchange or pool swap methods for buy necessary tokens, don't send directly to contract</small>
              </Alert>
            )
            :null
          }
          </React.Fragment>
        )
        :null
      }

      {
        this.state.isСalculate
        ?
        (
          <Pending/>
        )
        :null
      }
      </React.Fragment>
    )
  }

}

export default BuyPool

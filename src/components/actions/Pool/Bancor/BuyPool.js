import React, { Component } from 'react'
import { Form, Button, Alert } from "react-bootstrap"
import {
  SmartFundABIV4,
  PoolPortalABI,
  PoolPortal,
  ERC20ABI,
  EtherscanLink
} from '../../../../config.js'
import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import { toWei, fromWei } from 'web3-utils'
import Pending from '../../../templates/Spiners/Pending'
import setPending from '../../../../utils/setPending'

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
      showInfo:false,
      newPoolShare:0,
      currentPoolShare:0,
      curBancorConnectorAmount:0,
      curErcConnectorAmount:0
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.fromAddress !== this.props.fromAddress || prevState.amount !== this.state.amount){
      this.resetInfo()

      if(this.props.fromAddress && this.state.amount > 0)
         this.calculatePool()
    }
  }

  // Calculate BNT and ERC connector by pool amount
  calculatePool = async () => {
    if(this.props.fromAddress.length > 0 && this.state.amount > 0){
     this.setState({ isСalculate:true })
     const web3 = this.props.web3
     // get current reserve amount for pool
     const poolPortal = new web3.eth.Contract(PoolPortalABI, PoolPortal)

     // get connectors amount
     const { bancorAmount, connectorAmount } = await poolPortal.methods.getBancorConnectorsAmountByRelayAmount(
       toWei(String(this.state.amount)),
       this.props.fromAddress
     ).call()

     // get connectors address
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
     const bancorAmountFromWei = fromWeiByDecimalsInput(18, String(bancorAmount))
     const ercDecimals = await ercToken.methods.decimals().call()
     const connectorAmountFromWei = fromWeiByDecimalsInput(ercDecimals, String(connectorAmount))

     // convert from wei curent banlance
     const curentBalanceBNT = bntBalance > 0 ? fromWeiByDecimalsInput(18, String(bntBalance)) : 0
     const currentBalanceERC = ercBalance > 0 ? fromWeiByDecimalsInput(ercDecimals, String(ercBalance)) : 0

     // compare balance
     const isBNTEnough = parseFloat(curentBalanceBNT) >= parseFloat(bancorAmountFromWei) ? true : false
     const isERCEnough = parseFloat(currentBalanceERC) >= parseFloat(connectorAmountFromWei) ? true : false

     // get additional info
     const BNTConnectorSymbol = await this.getTokenSymbol(bntToken)
     const ERCConnectorSymbol = await this.getTokenSymbol(ercToken)
     const relay = new web3.eth.Contract(ERC20ABI, this.props.fromAddress)
     const RelaySymbol = await this.getTokenSymbol(relay)
     const relaySupply = await relay.methods.totalSupply().call()

     // get curent pool share
     const curentRelayBalance = await relay.methods.balanceOf(this.props.smartFundAddress).call()
     const currentPoolShare = 1 / ((parseFloat(fromWei(String(relaySupply))) / 100)
     / parseFloat(fromWei(String(curentRelayBalance))))

     // get current connectors amount
     const { bancorAmount:curBancorConnectorWei, connectorAmount: curErcConnectorAmountWei} =
     await poolPortal.methods.getBancorConnectorsAmountByRelayAmount(
       curentRelayBalance,
       this.props.fromAddress
     ).call()

     // convert connectors from wei
     const curBancorConnectorAmount = fromWei(String(curBancorConnectorWei))
     const curErcConnectorAmount = fromWeiByDecimalsInput(ercDecimals, String(curErcConnectorAmountWei))

     // get new pool share
     const poolOnePercent = (parseFloat(fromWei(String(relaySupply))) + parseFloat(this.state.amount)) / 100
     const newPoolShare = 1 / (parseFloat(poolOnePercent) / parseFloat(this.state.amount))

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
       newPoolShare,
       currentPoolShare,
       curBancorConnectorAmount,
       curErcConnectorAmount,
       isСalculate:false,
       showInfo:true
      })
    }
    else{
     alert('Please fill in all fields')
    }
  }

  // Buy Bancor Pool
  buy = async () => {
    if(this.state.isBNTEnough && this.state.isERCEnough){
      const web3 = this.props.web3
      const fund = new web3.eth.Contract(SmartFundABIV4, this.props.smartFundAddress)
      const block = await web3.eth.getBlockNumber()

      // buy pool
      fund.methods.buyPool(
        toWei(String(this.state.amount)),
        0,
        this.props.fromAddress,
        [])
      .send({ from:this.props.accounts[0] })
      .on('transactionHash', (hash) => {
      // pending status for spiner
      this.props.pending(true)
      // pending status for DB
      setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
      })

      // close pool modal
      this.props.modalClose()
    }
    else{
      alert('Your smart fund do not have enough reserve')
    }
  }

  // param ERC20 token contract instance
  getTokenSymbol = async (token) => {
    let symbol
    try{
      symbol = await token.methods.symbol().call()
    }catch(e){
      symbol = "ERC20"
    }

    return symbol
  }

  // reset states
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
      showInfo:false,
      newPoolShare:0,
      currentPoolShare:0,
      curBancorConnectorAmount:0,
      curErcConnectorAmount:0
     })
  }

  // update state only when user stop typing
  delayChange(evt) {
    if(this._timeout){ //if there is already a timeout in process cancel it
        clearTimeout(this._timeout)
    }
    const name = evt.target.name
    const val = evt.target.value
    this._timeout = setTimeout(()=>{
       this._timeout = null
       this.setState({
          [name]:val
       })
    },1000)
  }

  render() {
    return (
      <React.Fragment>
      <Form.Label><small>Note: for Bancor we calculate amount by Bancor pool token</small></Form.Label>
      <Form.Label><small>Enter amount of Bancor pool for buy</small></Form.Label>
      <Form.Control
      placeholder="Enter amount"
      name="amount"
      onChange={(e) => this.delayChange(e)}
      type="number" min="1"/>
      <br/>
      {
        this.state.isBNTEnough && this.state.isERCEnough
        ?
        (
          <>
          <Button variant="outline-primary" onClick={() => this.buy()}>Buy</Button>
          <br/>
          <br/>
          </>
        )
        : null
      }
      {
        this.state.showInfo
        ?
        (
          <React.Fragment>
          <Alert variant="warning">
          <strong>
          You will stake
          <hr/>
          <a href={EtherscanLink + "address/" + this.state.BNTConnector} target="_blank" rel="noopener noreferrer">{this.state.BNTConnectorSymbol}</a>
          &#8194;-&#8194;
          {Number(this.state.bancorAmountFromWei)}
          &#8194;
          and
          &#8194;
          <a href={EtherscanLink + "address/" + this.state.ERCConnector} target="_blank" rel="noopener noreferrer">{this.state.ERCConnectorSymbol}</a>
          &#8194;-&#8194;
          {Number(this.state.connectorAmountFromWei)}
          <hr/>
          You will recieve
          <hr/>
          <a href={EtherscanLink + "address/" + this.props.fromAddress} target="_blank" rel="noopener noreferrer">{this.state.RelaySymbol}</a>
          &#8194;-&#8194;
          { this.state.amount }
          </strong>
          <hr/>
          Additional info
          <small>
          <hr/>
          Your current share of pool : {this.state.currentPoolShare} %
          <hr/>
          Your gain share of pool will be : {this.state.newPoolShare} %
          <hr/>
          Your new share will be : {parseFloat(this.state.currentPoolShare) + parseFloat(this.state.newPoolShare)} %
          <hr/>
          Your current amount of assets in pool: {this.state.BNTConnectorSymbol} - {this.state.curBancorConnectorAmount} and {this.state.ERCConnectorSymbol} - {this.state.curErcConnectorAmount}
          <hr/>
          Your total amount of assets in pool will be : {this.state.BNTConnectorSymbol} - {parseFloat(this.state.bancorAmountFromWei) + parseFloat(this.state.curBancorConnectorAmount)}
          &#8194; and &#8194;
          {this.state.ERCConnectorSymbol} - {parseFloat(this.state.connectorAmountFromWei) + parseFloat(this.state.curErcConnectorAmount)}
          </small>
          </Alert>
          {
            !this.state.isBNTEnough || !this.state.isERCEnough
            ?
            (
              <Alert variant="danger">
              <small>
              You don't have enough balance,
              your balance is
              &#8194;
              {this.state.BNTConnectorSymbol}:&#8194;{Number(this.state.curentBalanceBNT)}
              &#8194;
              {this.state.ERCConnectorSymbol}:&#8194;{Number(this.state.currentBalanceERC)}.
              Note: please use exchange or pool swap methods for buy necessary tokens, don't send directly to contract address
              </small>
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

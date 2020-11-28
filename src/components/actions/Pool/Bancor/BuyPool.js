// Buy by pool amount

import React, { Component } from 'react'
import { Form, Button, Alert, Table } from "react-bootstrap"

import {
  PoolPortalABI,
  PoolPortalV7,
  ERC20ABI,
  EtherscanLink
} from '../../../../config.js'

import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import { toWei, fromWei } from 'web3-utils'
import Pending from '../../../templates/Spiners/Pending'
import setPending from '../../../../utils/setPending'
import checkTokensLimit from '../../../../utils/checkTokensLimit'
import getFundFundABIByVersion from '../../../../utils/getFundFundABIByVersion'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'

// Fund recognize ETH by this address
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'


class BuyPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0,
      currentPoolShare:0,
      newPoolShare:0,
      RelaySymbol:'',
      isСalculate: false,
      showInfo:false,
      connectorsDATA:[],
      isEnoughTotalBalanceForBuy:false
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.fromAddress !== this.props.fromAddress || prevState.amount !== this.state.amount){
      if(this.props.fromAddress && this.state.amount > 0)
         this.calculatePool()
    }
  }

  // Calculate BNT and ERC connector by pool amount
  calculatePool = async () => {
    if(this.props.fromAddress.length > 0 && this.state.amount > 0){
     const poolAddress = this.props.fromAddress

     this.setState({ isСalculate: true })

     const web3 = this.props.web3

     // get current reserve amount for pool
     const poolPortal = new web3.eth.Contract(PoolPortalABI, PoolPortalV7)

     // get connectors address
     const connectors = await poolPortal.methods.getBancorConnectorsByRelay(
       poolAddress
     ).call()

     let connectorAddress
     let connectorAmount
     let connectorBalance
     let connectorAmountFromWei
     let connectorBalanceFromWei
     let isETHConnector = false
     let isEnoughBalance
     let symbol
     let isEnoughTotalBalanceForBuy = true

     const connectorsDATA = []

     for(let i = 0; i < connectors.length; i++){
       connectorAddress = connectors[i]

       // get connector amount needs
       connectorAmount = await poolPortal.methods.getBancorConnectorsAmountByRelayAmount(
         toWei(String(this.state.amount)),
         poolAddress,
         connectors[i]).call()

       // get connector balance
       // and convert data from wei

       // ETH case
       if(String(connectors[i]).toLowerCase() === String(ETH).toLowerCase()){
         connectorBalance = web3.eth.getBalance(this.props.smartFundAddress)
         connectorAmountFromWei = fromWei(connectorAmount)
         connectorBalanceFromWei = fromWei(connectorBalance)
         isETHConnector = true
         symbol = "ETH"
       }
       // ERC20 case
       else{
         const tokenContract = new web3.eth.Contract(ERC20ABI, connectors[i])
         connectorBalance = await tokenContract.methods.balanceOf(this.props.smartFundAddress).call()

         connectorAmountFromWei = connectorAmount > 0
         ? fromWeiByDecimalsInput(await tokenContract.methods.decimals().call(), connectorAmount)
         : 0
         connectorBalanceFromWei = connectorBalance > 0
         ? fromWeiByDecimalsInput(await tokenContract.methods.decimals().call(), connectorBalance)
         : 0

         symbol = await this.getTokenSymbol(tokenContract)
       }

       // check if enough balance for cur connector
       isEnoughBalance = parseFloat(connectorBalanceFromWei) >= parseFloat(connectorAmountFromWei) ? true : false

       if(!isEnoughBalance)
         isEnoughTotalBalanceForBuy = false

       connectorsDATA.push({
         connectorAddress,
         connectorAmount,
         connectorBalance,
         connectorAmountFromWei,
         connectorBalanceFromWei,
         isETHConnector,
         isEnoughBalance,
         symbol
       })
     }

     const relay = new web3.eth.Contract(ERC20ABI, poolAddress)
     const RelaySymbol = await this.getTokenSymbol(relay)
     const relaySupply = await relay.methods.totalSupply().call()

     // get curent pool share
     const curentRelayBalance = await relay.methods.balanceOf(this.props.smartFundAddress).call()
     const currentPoolShare = 1 / ((parseFloat(fromWei(String(relaySupply))) / 100)
     / parseFloat(fromWei(String(curentRelayBalance))))

     // get new pool share
     const poolOnePercent = (parseFloat(fromWei(String(relaySupply))) + parseFloat(this.state.amount)) / 100
     const newPoolShare = 1 / (parseFloat(poolOnePercent) / parseFloat(this.state.amount))

     // update state
     this.setState({
       currentPoolShare,
       newPoolShare,
       RelaySymbol,
       connectorsDATA,
       isEnoughTotalBalanceForBuy,
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
    if(this.state.isEnoughTotalBalanceForBuy){
      try{
        const web3 = this.props.web3
        // Get ABI according fund version
        const FundABI = getFundFundABIByVersion(this.props.version)
        // get fund contract instance
        const fund = new web3.eth.Contract(FundABI, this.props.smartFundAddress)
        // this function will throw execution with alert warning if there are limit
        await checkTokensLimit(this.props.fromAddress, fund)
        // get gas price from local storage
        const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000
        // get block number
        const block = await web3.eth.getBlockNumber()
        // get pool params
        const poolParams = await this.getPoolParams()
        // buy pool
        fund.methods.buyPool(...poolParams)
        .send({ from:this.props.accounts[0], gasPrice })
        .on('transactionHash', (hash) => {
        // pending status for spiner
        this.props.pending(true)
        // pending status for DB
        setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
        })
        // close pool modal
        this.props.modalClose()
      }catch(e){
        alert('Can not verify transaction data, please try again in a minute')
        console.log(e)
      }
    }
    else{
      alert('Your smart fund do not have enough reserve')
    }
  }

  // return pool params for buyPool
  // different version of smart fund
  // require different pool params
  getPoolParams = async () => {
    let params

    const commonParams = [
      toWei(String(this.state.amount)),
      0,
      this.props.fromAddress
    ]

    // V7 and newest
    if(this.props.version >= 7){
      // get pool portal instance
      const poolPortal = new this.props.web3.eth.Contract(PoolPortalABI, PoolPortalV7)
      // get conenctors address and amount from pool portal by pool amount
      const {
        connectorsAddress,
        connectorsAmount } = await poolPortal.methods.getDataForBuyingPool(
          this.props.fromAddress, // pool token
          0, // type Bancor
          toWei(String(this.state.amount)) // pool amount
        ).call()

      // V7 params
      params = [
        ...commonParams,
        connectorsAddress,
        connectorsAmount,
        [
          numStringToBytes32(String(this.props.converterVersion)),
          numStringToBytes32(String(this.props.converterType))
        ],
        this.props.web3.eth.abi.encodeParameters(
          ['uint256'],
          [1]
        )
      ]
    }
    else if(this.props.version !== 5 && this.props.version !== 6){
      params = [...commonParams, []]
    }else{
      // 5 and 6 version not support bytes32[] _additionalArgs
      params = [...commonParams]
    }

    return params
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
    console.log("type and version", this.props.converterVersion, this.props.converterType)
    return (
      <React.Fragment>
      <Form.Label><small>Note: for Bancor old version of pools we calculate pool amount by Bancor pool token</small></Form.Label>
      <Form.Label><small>Enter amount of Bancor pool for buy</small></Form.Label>
      <Form.Control
      placeholder="Enter amount"
      name="amount"
      onChange={(e) => this.delayChange(e)}
      type="number" min="1"/>
      <br/>
      {
        this.state.isEnoughTotalBalanceForBuy
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
        this.state.isСalculate
        ?
        (
          <Pending/>
        )
        :null
      }
      {
        this.state.showInfo && this.state.connectorsDATA.length > 0
        ?
        (
          <React.Fragment>
          <small>
          <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Your ERC20 tokens</th>
              <th>You will stake</th>
            </tr>
          </thead>
          {
            this.state.connectorsDATA.map((item, key) => {
              return(
                <tbody key={key}>
                <tr>
                  <td>
                  <a href={EtherscanLink + "address/" + item.connectorAddress} target="_blank" rel="noopener noreferrer">{item.symbol}</a>
                   :
                   {Number(item.connectorBalanceFromWei).toFixed(12)}
                  </td>
                  <td>+ {Number(item.connectorAmountFromWei).toFixed(12)}</td>
                </tr>
              </tbody>
              )
            })
          }
          </Table>
          <Table striped bordered hover size="sm">
          <thead>
           <tr>
             <th>Your pool token</th>
             <th>You will get</th>
           </tr>
          </thead>
          <tbody>
            <tr>
              <td>
               <a href={EtherscanLink + "address/" + this.props.fromAddress} target="_blank" rel="noopener noreferrer">{this.state.RelaySymbol}</a>
               :
               {Number(this.state.currentPoolShare).toFixed(12)}</td>
              <td>+ {Number(this.state.amount).toFixed(12)}</td>
            </tr>
          </tbody>
          </Table>
          <Table striped bordered hover size="sm">
          <thead>
           <tr>
             <th>Your {this.state.ERCConnectorSymbol}</th>
             <th>pool share</th>
           </tr>
          </thead>
          <tbody>
            <tr>
              <td>Share now</td>
              <td>{Number(this.state.currentPoolShare).toFixed(12)} %</td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share gain</td>
              <td>{Number(this.state.newPoolShare).toFixed(12)} %</td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share new</td>
              <td>{Number(parseFloat(this.state.currentPoolShare) + parseFloat(this.state.newPoolShare)).toFixed(12)} %</td>
            </tr>
          </tbody>
          </Table>
          </small>
          {
            !this.state.isEnoughTotalBalanceForBuy
            ?
            (
              <Alert variant="danger">
              <small>
              insufficient,
              your balance is

              <hr/>
              {
                this.state.connectorsDATA.map((item, key) => {
                  return(
                    <p key={key}>
                    {item.symbol}:&#8194;{Number(item.connectorBalanceFromWei)}
                    </p>
                  )
                })
              }
              <hr/>

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
      </React.Fragment>
    )
  }

}

export default BuyPool

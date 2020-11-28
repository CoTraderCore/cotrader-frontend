import React, { Component } from 'react'
import { Alert, Form, Button } from "react-bootstrap"

import {
  ERC20ABI,
  PoolPortalABI,
  PoolPortalV7,
  BancorConverterABI
} from '../../../../config.js'

import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import setPending from '../../../../utils/setPending'
import { toWei, fromWei } from 'web3-utils'
import getFundFundABIByVersion from '../../../../utils/getFundFundABIByVersion'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'

// Fund recognize ETH by this address
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

class SellPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0,
      connectorsDATA:[],
      isEnoughBalance:false,
      isComputed:false,
      ErrorText:''
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.fromAddress !== this.props.fromAddress || prevState.amount !== this.state.amount){
      this.resetInfo()
      this.updateInfo()
    }
  }

  // update pool balance of fund, connectors amount, connectors symbols
  updateInfo = async () => {
    if(this.props.fromAddress && this.state.amount > 0){
      const web3 = this.props.web3
      const poolAddress = this.props.fromAddress

      // get current reserve amount for pool
      const poolPortal = new web3.eth.Contract(PoolPortalABI, PoolPortalV7)

      // get connectors address
      const connectors = await poolPortal.methods.getBancorConnectorsByRelay(
        poolAddress
      ).call()

      let connectorAmount
      let connectorAmountFromWei
      let symbol
      const connectorsDATA = []

      for(let i = 0; i < connectors.length; i++){
        // get connector amount needs
        connectorAmount = await poolPortal.methods.getBancorConnectorsAmountByRelayAmount(
          toWei(String(this.state.amount)),
          poolAddress,
          connectors[i]).call()

          // ETH case
          if(String(connectors[i]).toLowerCase() === String(ETH).toLowerCase()){
            symbol = "ETH"
            connectorAmountFromWei = fromWei(connectorAmount)
          }
          // ERC20 case
          else{
            const tokenContract = new web3.eth.Contract(ERC20ABI, connectors[i])
            try{
              symbol = await tokenContract.methods.symbol().call()
            }catch(e){
              symbol = "ERC"
            }

            connectorAmountFromWei = connectorAmount > 0
            ? fromWeiByDecimalsInput(await tokenContract.methods.decimals().call(), connectorAmount)
            : 0
          }

          connectorsDATA.push({ symbol, connectorAmount, connectorAmountFromWei })
      }

      // check fund balance
      const { fundBalanceFromWei } = await this.getFundBalance()
      const isEnoughBalance = fundBalanceFromWei >= this.state.amount ? true : false
      const ErrorText = !isEnoughBalance ? 'Insufficient Balance' : ''

      this.setState({
        connectorsDATA,
        isEnoughBalance,
        ErrorText,
        isComputed:true
      })
    }
  }

  getConnectors = async (converterAddress) => {
    if(converterAddress){
      const converter = new this.props.web3.eth.Contract(BancorConverterABI, converterAddress)
      const connectorsCount = await converter.methods.connectorTokenCount().call()
      const connectors = []

      for(let i = 0; i < connectorsCount; i++){
        const address = await converter.methods.connectorTokens(i).call()
        connectors.push(address)
      }

      return connectors
    }
  }

  resetInfo(){
    this.setState({
      connectorsDATA:[],
      isEnoughBalance:false,
      isComputed:false,
      ErrorText:''
    })
  }

  getFundBalance = async () => {
    const web3 = this.props.web3
    const token = new web3.eth.Contract(ERC20ABI, this.props.fromAddress)
    const fundBalance = await token.methods.balanceOf(this.props.smartFundAddress).call()
    const decimals = await token.methods.decimals().call()
    const fundBalanceFromWei = fromWeiByDecimalsInput(decimals, String(fundBalance))

    return { fundBalance, fundBalanceFromWei }
  }

  setMaxSell = async () => {
    const { fundBalanceFromWei } = await this.getFundBalance()
    this.setState({ amount:fundBalanceFromWei })

    if(Number(fundBalanceFromWei) === 0)
      this.setState({
         ErrorText:"Your balance is empty"
      })
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
      const connectorsAddress = await this.getConnectors(this.props.converterAddress)
      const reserveMinReturnAmounts = Array(connectorsAddress.length).fill(1)

      // V7 params
      params = [
        ...commonParams,
        [
          numStringToBytes32(String(this.props.converterVersion)),
          numStringToBytes32(String(this.props.converterType))
        ],
        this.props.web3.eth.abi.encodeParameters(
          ['address[]', 'uint256[]'],
          [connectorsAddress, reserveMinReturnAmounts]
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

  // Sell pool
  sell = async () => {
    if(this.props.fromAddress.length > 0 && this.state.amount > 0){
      try{
        const web3 = this.props.web3
        // get gas price from local storage
        const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000
        // check fund balance
        const { fundBalanceFromWei } = await this.getFundBalance()
        // allow sell if fund has enough balance
        if(fundBalanceFromWei >= this.state.amount){
          // Get ABI according fund version
          const FundABI = getFundFundABIByVersion(this.props.version)
          // Get smart fund instance
          const fund = new web3.eth.Contract(FundABI, this.props.smartFundAddress)
          // Get block number
          const block = await web3.eth.getBlockNumber()
          // Get pool params for current fund version
          const poolParams = await this.getPoolParams()
          // Sell
          fund.methods.sellPool(...poolParams).send({ from:this.props.accounts[0], gasPrice })
          .on('transactionHash', (hash) => {
          // pending status for spiner
          this.props.pending(true)
          // pending status for DB
          setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
          // close pool modal
          this.props.modalClose()
          })
        }
        else{
          this.setState({
             ErrorText:"Not enough balance in your fund"
          })
        }
      }
      catch(e){
        alert('Can not verify transaction data, please try again in a minute')
      }
    }
    else{
      this.setState({
         ErrorText:"Please fill in all fields"
      })
    }
  }

  ERROR(errText){
    return (
      <Alert variant="danger">
      {errText}
      </Alert>
    )
  }

  render() {
    return (
      <React.Fragment>
      <Form>
      <Form.Group>
      <Form.Label><small>Enter amount to sell</small> &nbsp;</Form.Label>
      {
        this.props.fromAddress
        ?
        (
          <Button variant="outline-secondary" size="sm" onClick={() => this.setMaxSell()}>max</Button>
        ):null
      }
      <Form.Control
      placeholder="Enter amount"
      name="amount"
      onChange={(e) => this.setState({ amount: e.target.value })}
      value={this.state.amount > 0 ? this.state.amount : ""}
      type="number" min="1"/>
      <br/>
      {
        this.state.ErrorText.length > 0
        ?
        <>{this.ERROR(this.state.ErrorText)}</>
        :null
      }

      {
        this.state.isEnoughBalance
        ?
        (
          <>

          <Button variant="outline-primary" onClick={() => this.sell()}>Sell</Button>
          </>
        )
        : null
      }
      <br/>
      {
        this.state.connectorsDATA.length > 0
        ?
        (
          <Alert variant="success">
          You will receive:
          <hr/>
          {
            this.state.connectorsDATA.map((item, key) => {
              return(
                <p key={key}>
                {item.symbol}&nbsp;:&nbsp;{item.connectorAmountFromWei}
                </p>
              )
            })
          }
          </Alert>
        ):null
      }

      </Form.Group>
      </Form>
      </React.Fragment>
    )
  }

}

export default SellPool

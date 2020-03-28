import React, { Component } from 'react'

import {
  SmartFundABIV5,
  UniswapFactoryABI,
  UniswapFactory,
  PoolPortalABI,
  PoolPortal,
  ERC20ABI
} from '../../../../config.js'

import { Form, Button, Alert } from "react-bootstrap"
import { toWei, fromWei } from 'web3-utils'
import setPending from '../../../../utils/setPending'
import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'



class SellPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      UniAmount:0,
      ethAmountFromWei:0,
      ercAmountFromWei:0,
      ercSymbol:'',
      curUNIBalance:0,
      ErrorText:'',
      isComputed:false,
      isEnoughBalance:false
    }
  }


  componentDidUpdate(prevProps, prevState){
    if(prevProps.tokenAddress !== this.props.tokenAddress || prevState.UniAmount !== this.state.UniAmount){
      this.resetInfo()
      this.updateInfo()
    }
  }

  // Check current pool balance in fund, get pool connectors amount and ERC connector symbol
  updateInfo = async() => {
    if(this.props.tokenAddress && this.state.UniAmount > 0)
      try{
        // get core data
        const uniswapFactory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
        const exchangeAddress = await uniswapFactory.methods.getExchange(this.props.tokenAddress).call()
        const poolPortal = new this.props.web3.eth.Contract(PoolPortalABI, PoolPortal)
        const ercToken = new this.props.web3.eth.Contract(ERC20ABI, this.props.tokenAddress)
        const tokenDecimals = await ercToken.methods.decimals().call()

        let ercSymbol
        // wrap try catch for bytes32 return
        try{
          ercSymbol = await ercToken.methods.symbol().call()
        }catch(e){
          ercSymbol = "ERC20"
        }

        // get UNI Pool conenctors amount
        const { ethAmount, ercAmount } = await poolPortal.methods.getUniswapConnectorsAmountByPoolAmount(
          toWei(this.state.UniAmount),
          exchangeAddress
        ).call()

        // convert connectots from wei
        const ethAmountFromWei = fromWei(String(ethAmount))
        const ercAmountFromWei = fromWeiByDecimalsInput(tokenDecimals, String(ercAmount))

        // check cur balance
        const curUNIBalance = await this.getCurBalance()
        const isEnoughBalance = fromWei(String(curUNIBalance)) >= this.state.UniAmount ? true : false

        // update states
        this.setState({
          ethAmountFromWei,
          ercAmountFromWei,
          ercSymbol,
          curUNIBalance,
          isEnoughBalance,
          isComputed:true
        })

      }catch(e){
        this.setState({
          ErrorText:"Sorry, but this token is not available, for Uniswap pool. Please try another token."
        })
      }
  }

  // reset states
  resetInfo(){
    this.setState({
      ethAmountFromWei:0,
      ercAmountFromWei:0,
      ercSymbol:'',
      curUNIBalance:0,
      isEnoughBalance:false,
      ErrorText:'',
      isComputed:false
    })
  }

  // check cur UNI pool balance in fund address
  getCurBalance = async () => {
    if(this.props.tokenAddress){
      const factory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
      const poolExchangeAddress = await factory.methods.getExchange(this.props.tokenAddress).call()
      const exchangeERCContract = new this.props.web3.eth.Contract(ERC20ABI, poolExchangeAddress)
      const curBalance = await exchangeERCContract.methods.balanceOf(this.props.smartFundAddress).call()
      return curBalance
    }else{
      return 0
    }
  }

  // set max input by cur balance
  setMaxSell = async () => {
    const curBalance = await this.getCurBalance()
    this.setState({ UniAmount:fromWei(String(curBalance)) })

    if(Number(fromWei(String(curBalance))) === 0)
      this.setState({
         ErrorText:"Your balance is empty"
      })
  }

  // sell pool
  sellPool = async () => {
    if(this.state.UniAmount > 0){
      // get additional data
      const factory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
      const poolExchangeAddress = await factory.methods.getExchange(this.props.tokenAddress).call()
      const curBalance = await this.getCurBalance()

      // check fund balance
      if(fromWei(String(curBalance)) >= this.state.UniAmount){
        // sell pool
        const fund = new this.props.web3.eth.Contract(SmartFundABIV5, this.props.smartFundAddress)
        const block = await this.props.web3.eth.getBlockNumber()
        fund.methods.sellPool(toWei(String(this.state.UniAmount)), 1, poolExchangeAddress)
        .send({ from: this.props.accounts[0] })
        .on('transactionHash', (hash) => {
        // pending status for spiner
        this.props.pending(true)
        // pending status for DB
        setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
        })
        // close pool modal
        this.props.modalClose()
      }else{
        alert('Not enough balance in your fund')
      }
    }else{
      alert('Please input amount')
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
      <Form>
      <Form.Group>
      <Form.Label><small>Enter amount to sell</small> &nbsp;</Form.Label>
      {
        this.props.tokenAddress
        ?
        (
          <Button variant="outline-secondary" size="sm" onClick={() => this.setMaxSell()}>
          max
          </Button>
        ):null
      }
      <Form.Control
      type="number"
      min="0"
      placeholder="Uniswap pool amount"
      name="UniAmount"
      value={this.state.UniAmount > 0 ? this.state.UniAmount : ""}
      onChange={e => this.setState({ UniAmount:e.target.value })}
      />
      </Form.Group>

      {
        this.state.ErrorText.length > 0
        ?
        <small>
        {this.ERROR(this.state.ErrorText)}
        </small>
        :null
      }

      {
        this.state.isEnoughBalance
        ?
        (
          <Button
          variant="outline-primary"
          type="button"
          onClick={() => this.sellPool()}
          >
          Sell
          </Button>
        )
        :
        (
          <>
          {
            this.state.isComputed
            ?
            (
              <small style={{color:"red"}}>Insufficient Balance</small>
            ):null
          }
          </>
        )
      }
      <br/>
      <br/>
      {
        this.state.ethAmountFromWei > 0 && this.state.ercAmountFromWei > 0
        ?
        (
          <Alert variant="success">
          You will receive
          &nbsp;
          ETH : {this.state.ethAmountFromWei},
          &nbsp;
          {this.state.ercSymbol} : {this.state.ercAmountFromWei}
          </Alert>
        )
        :null
      }
      </Form>
    )
  }

}

export default SellPool

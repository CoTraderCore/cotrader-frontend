import React, { Component } from 'react'

import {
  UniswapFactoryABI,
  UniswapFactory,
  PoolPortalABI,
  PoolPortalV6,
  ERC20ABI
} from '../../../../config.js'

import { Form, Button, Alert } from "react-bootstrap"
import { toWei, fromWei } from 'web3-utils'
import setPending from '../../../../utils/setPending'
import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import getFundFundABIByVersion from '../../../../utils/getFundFundABIByVersion'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'



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
        const poolPortal = new this.props.web3.eth.Contract(PoolPortalABI, PoolPortalV6)
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
      try{
        const curBalance = await this.getCurBalance()

        // get gas price from local storage
        const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

        // check fund balance
        if(fromWei(String(curBalance)) >= this.state.UniAmount){
          // Get ABI according fund version
          const FundABI = getFundFundABIByVersion(this.props.version)

          // sell pool
          const fund = new this.props.web3.eth.Contract(FundABI, this.props.smartFundAddress)
          const block = await this.props.web3.eth.getBlockNumber()

          const poolParams = await this.getPoolParams()

          fund.methods.sellPool(...poolParams)
          .send({ from: this.props.accounts[0], gasPrice })
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
          alert('Not enough balance in your fund')
        }
      }
      catch(e){
        alert('Can not verify transaction data, please try again in a minute')
      }
    }
    else{
      alert('Please input amount')
    }
  }

  // return pool params for buyPool
  // different version of smart fund
  // require different pool params
  getPoolParams = async () => {
    // get additional data
    const factory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
    const poolExchangeAddress = await factory.methods.getExchange(this.props.tokenAddress).call()

    let params

    const commonParams = [
      toWei(String(this.state.UniAmount)),
      1,
      poolExchangeAddress
    ]

    // V7 and newest
    if(this.props.version >= 7){
      // V7 params
      params = [
        ...commonParams,
        [
          numStringToBytes32(String(1)),
        ],
        "0x"
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

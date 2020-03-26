import React, { Component } from 'react'

import {
  SmartFundABIV5,
  UniswapFactoryABI,
  UniswapFactory,
  PoolPortalABI,
  PoolPortal,
  ERC20ABI,
  EtherscanLink
} from '../../../../config.js'

import Pending from '../../../templates/Spiners/Pending'
import { Form, Button, Alert } from "react-bootstrap"
import { toWei, fromWei, hexToNumberString } from 'web3-utils'
import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import setPending from '../../../../utils/setPending'


class BuyPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      ETHAmount:0,
      ERCAmountInWEI:'0',
      ERCAmount:0,
      ERCSymbol: '',
      ErrorText:'',
      mintLiquidity:0,
      isComputed:false,
      ERCAddress:'',
      UNIPoolAddress:'',
      newPoolShare:0,
      currentPoolShare:0,
      curEthAmount:0,
      curErcAmount:0
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.tokenAddress !== this.props.tokenAddress || prevState.ETHAmount !== this.state.ETHAmount){
      this.resetInfo()

      if(this.props.tokenAddress && this.state.ETHAmount > 0)
        this.calculate()
    }
  }

  resetInfo(){
    this.setState({
      ERCAmountInWEI:'0',
      ERCAmount:0,
      ERCSymbol: '',
      ErrorText:'',
      mintLiquidity:0,
      ERCAddress:'',
      UNIPoolAddress:'',
      newPoolShare:0,
      currentPoolShare:0,
      curEthAmount:0,
      curErcAmount:0
    })
  }

  checkBalance = async () => {
    const token = new this.props.web3.eth.Contract(ERC20ABI, this.props.tokenAddress)
    const tokenDecimals = await token.methods.decimals().call()
    const tokenBalance = await token.methods.balanceOf(this.props.smartFundAddress).call()
    const tokenFromWei = fromWeiByDecimalsInput(tokenDecimals, tokenBalance)
    const ethBalance = await this.props.web3.eth.getBalance(this.props.smartFundAddress)
    const ethFromWei = fromWei(ethBalance)

    if(parseFloat(this.state.ETHAmount) > parseFloat(ethFromWei)
    || parseFloat(this.state.ERCAmount) > parseFloat(tokenFromWei)){
      this.setState({
        ErrorText:`Your smart fund does not have enough assets for these operations
        your balance: ETH : ${ethFromWei}, ${this.state.ERCSymbol} : ${tokenFromWei},
        please use exchange for buy assets, don't send directly to contract address`
      })
    }
  }

  // Calculate UNI pool and ERC20 amount by ETH amount
  // Calculate share of pool
  // Calculate current amount of pool connectorts
  calculate = async () => {
   this.setState({ isComputed:true })
   try{
     // GET ERC20 info
     const poolPortal = new this.props.web3.eth.Contract(PoolPortalABI, PoolPortal)
     const ERCAmount = await poolPortal.methods.getUniswapTokenAmountByETH(
       this.props.tokenAddress, toWei(this.state.ETHAmount)
      ).call()

     const token = new this.props.web3.eth.Contract(ERC20ABI, this.props.tokenAddress)
     const decimals = await token.methods.decimals().call()

     let ERCSymbol

     try{
      ERCSymbol = await token.methods.symbol().call()
     }catch(e){
      ERCSymbol = 'ERC'
     }

     // GET UNI Pool info
     const factory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
     const poolExchangeAddress = await factory.methods.getExchange(this.props.tokenAddress).call()
     const exchangeERC = new this.props.web3.eth.Contract(ERC20ABI, poolExchangeAddress)
     const totalSupply = await exchangeERC.methods.totalSupply().call()
     const ethReserve = await this.props.web3.eth.getBalance(poolExchangeAddress)

     // GET Uni pool amount
     const mintLiquidity = parseFloat(this.state.ETHAmount)
      * (parseFloat(fromWei(String(totalSupply)))
      / (parseFloat(fromWei(String(ethReserve))) - parseFloat(this.state.ETHAmount)))



     // GET cur share
     const curPoolBalance = await exchangeERC.methods.balanceOf(this.props.smartFundAddress).call()
     const currentPoolShare = 1 / ((parseFloat(fromWei(String(totalSupply))) / 100)
     / parseFloat(fromWei(String(curPoolBalance))))

     // GET cur connectors amount
     const { ethAmount:curEthAmountWei, ercAmount:curErcAmountWei } =
     await poolPortal.methods.getUniswapConnectorsAmountByPoolAmount(
       curPoolBalance,
       poolExchangeAddress
     ).call()

     // GET new share
     const poolOnePercent = (parseFloat(fromWei(String(totalSupply))) + parseFloat(mintLiquidity)) / 100
     const newPoolShare = 1 / (poolOnePercent / parseFloat(mintLiquidity))

     // Convert from wei
     const curEthAmount = fromWei(String(curEthAmountWei))
     const curErcAmount = fromWeiByDecimalsInput(decimals, String(curErcAmountWei))


     this.setState({
      ERCAmountInWEI: hexToNumberString(ERCAmount._hex),
      ERCAmount: fromWeiByDecimalsInput(decimals, hexToNumberString(ERCAmount._hex)),
      ERCSymbol,
      mintLiquidity,
      newPoolShare,
      currentPoolShare,
      ERCAddress:this.props.tokenAddress,
      UNIPoolAddress: poolExchangeAddress,
      curEthAmount,
      curErcAmount
     })
     await this.checkBalance()
   }
   catch(e){
     this.setState({
       mintLiquidity:0,
       ErrorText:"Sorry, but this token is not available, for Uniswap pool. Please try another token."
     })
     console.log(e)
   }

   this.setState({ isComputed:false })
  }


  // Buy Uniswap pool
  buyPool = async () => {
    if(this.state.ETHAmount > 0 && this.props.tokenAddress){
      // get contracts and data
      const factory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
      const poolExchangeAddress = await factory.methods.getExchange(this.props.tokenAddress).call()
      const fund = new this.props.web3.eth.Contract(SmartFundABIV5, this.props.smartFundAddress)
      const block = await this.props.web3.eth.getBlockNumber()

      // buy pool
      fund.methods.buyPool(toWei(String(this.state.ETHAmount)), 1, poolExchangeAddress)
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
      alert('Please fill all fields')
    }
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
      <Form.Label><small>Note: for Uniswap pool we calculate amount of pool by ETH amount</small></Form.Label>
      <Form.Label><small>Enter amount of ETH for send in pool</small></Form.Label>
      <Form.Control
      type="number"
      min="0"
      placeholder="ETH amount"
      name="ETHAmount"
      onChange={(e) => this.delayChange(e)}
      />
      </Form.Group>
      {
        !this.state.isComputed && this.state.mintLiquidity > 0 && this.state.ErrorText.length === 0
        ?
        (
          <>
          <Button
          variant="outline-primary"
          type="button"
          onClick={() => this.buyPool()}
          >
          Buy
          </Button>
          <br/>
          <br/>
          </>
        )
        : this.state.isComputed ? (<Pending/>) : null
      }
      {
        parseFloat(this.state.ERCAmount) > 0
        ?
        (
          <React.Fragment>
          <Alert variant="warning">
          <strong>
          You will stake
          <hr/>
          ETH: {this.state.ETHAmount} and &#8194;
          <a href={EtherscanLink + "address/" + this.state.ERCAddress} target="_blank" rel="noopener noreferrer">{this.state.ERCSymbol}</a>
           : {this.state.ERCAmount}
          <hr/>
          You will receive
          <hr/>
          <a href={EtherscanLink + "address/" + this.state.UNIPoolAddress} target="_blank" rel="noopener noreferrer">{this.state.ERCSymbol} UNI-V1 </a>
          : {this.state.mintLiquidity}
          <hr/>
          </strong>
          Additional info
          <small>
          <hr/>
          Your current share of pool : {this.state.currentPoolShare} %
          <hr/>
          Your gain share of pool will be : {this.state.newPoolShare} %
          <hr/>
          Your total share will be : {parseFloat(this.state.currentPoolShare) + parseFloat(this.state.newPoolShare)} %
          <hr/>
          Your current amount of assets in pool: ETH - {this.state.curEthAmount} and {this.state.ERCSymbol} - {this.state.curErcAmount}
          <hr/>
          Your total amount of assets in pool will be : ETH - {parseFloat(this.state.ETHAmount) + parseFloat(this.state.curEthAmount)}
          &#8194; and &#8194;
          {this.state.ERCSymbol} - {parseFloat(this.state.ERCAmount) + parseFloat(this.state.curErcAmount)}
          </small>
          </Alert>
          </React.Fragment>
        )
        :null
      }
      {
        this.state.ErrorText.length > 0
        ?
        <small>
        {this.ERROR(this.state.ErrorText)}
        </small>
        :null
      }
      </Form>
    )
  }

}

export default BuyPool

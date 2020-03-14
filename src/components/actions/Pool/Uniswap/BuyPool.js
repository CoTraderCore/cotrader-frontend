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
      ErrorText:''
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.tokenAddress !== this.props.tokenAddress || prevState.ETHAmount !== this.state.ETHAmount){
      this.setState({ ERCAmount:0, ErrorText: '' })
    }
  }

  checkBalance = async () => {
    const token = new this.props.web3.eth.Contract(ERC20ABI, this.props.tokenAddress)
    const tokenDecimals = await token.methods.decimals().call()
    const tokenBalance = await token.methods.balanceOf(this.props.smartFundAddress).call()
    const tokenFromWei = fromWeiByDecimalsInput(tokenDecimals, tokenBalance)
    const ethBalance = await this.props.web3.eth.getBalance(this.props.smartFundAddress)
    const ethFromWei = fromWei(ethBalance)
    console.log(parseFloat(this.state.ETHAmount), parseFloat(ethFromWei), parseFloat(this.state.ERCAmount), parseFloat(ethFromWei))
    if(parseFloat(this.state.ETHAmount) > parseFloat(ethFromWei)
    || parseFloat(this.state.ERCAmount) > parseFloat(tokenFromWei)){
      this.setState({
        ErrorText:`Your smart fund does not have enough assets for these operations
        your balance: ETH ${ethFromWei}, ERC connector ${tokenFromWei}`
      })
    }
  }

  calculate = async () => {
    if(this.state.ETHAmount > 0 && this.props.tokenAddress){
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

      try{
        this.setState({
          ERCAmountInWEI: hexToNumberString(ERCAmount._hex),
          ERCAmount: fromWeiByDecimalsInput(decimals, hexToNumberString(ERCAmount._hex)),
          ERCSymbol
        })
        this.checkBalance()
      }catch(e){
        this.setState({
          ErrorText:"Sorry, but this token is not available, for Uniswap pool. Please try another token."
        })
        console.log(e)
      }


      console.log(this.state.ERCAmount, this.state.ERCAmountInWEI)
    }else{
      alert('Please fill all fields')
    }
  }

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
      onChange={e => this.setState({ ETHAmount:e.target.value })}
      />
      </Form.Group>

      <Button
      variant="outline-primary"
      type="button"
      onClick={() => this.calculate()}
      >
      Calculate
      </Button>
      <br/>
      <br/>
      {
        parseFloat(this.state.ERCAmount) > 0
        ?
        (
          <React.Fragment>
          <Alert variant="warning">
          You will stake {this.state.ETHAmount} ETH
          and {this.state.ERCAmount} {this.state.ERCSymbol}
          </Alert>

          {
            this.state.ErrorText.length === 0
            ?
            (
              <Button
              variant="outline-primary"
              type="button"
              onClick={() => this.buyPool()}
              >
              Buy
              </Button>
            )
            :null
          }
          </React.Fragment>
        )
        :null
      }
      {
        this.state.ErrorText.length > 0
        ?
        <>
        {this.ERROR(this.state.ErrorText)}
        </>
        :null
      }
      </Form>
    )
  }

}

export default BuyPool

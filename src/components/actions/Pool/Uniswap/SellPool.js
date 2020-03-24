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
      ercSymbol:''
    }
  }


  componentDidUpdate(prevProps, prevState){
    if(prevProps.tokenAddress !== this.props.tokenAddress || prevState.UniAmount !== this.state.UniAmount){
      this.updateSellInfo()
    }
  }

  // set connectors amount and connector token symbol in state
  updateSellInfo = async() => {
    if(this.props.tokenAddress && this.state.UniAmount > 0){
      const uniswapFactory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
      const exchangeAddress = await uniswapFactory.methods.getExchange(this.props.tokenAddress).call()
      const poolPortal = new this.props.web3.eth.Contract(PoolPortalABI, PoolPortal)
      const ercToken = new this.props.web3.eth.Contract(ERC20ABI, this.props.tokenAddress)
      const tokenDecimals = await ercToken.methods.decimals().call()

      let ercSymbol
      // try catch for bytes32 return
      try{
        ercSymbol = await ercToken.methods.symbol().call()
      }catch(e){
        ercSymbol = "ERC20"
      }

      const { ethAmount, ercAmount } = await poolPortal.methods.getUniswapConnectorsAmountByPoolAmount(
        toWei(this.state.UniAmount),
        exchangeAddress
      ).call()

      const ethAmountFromWei = fromWei(String(ethAmount))
      const ercAmountFromWei = fromWeiByDecimalsInput(tokenDecimals, String(ercAmount))

      this.setState({ ethAmountFromWei, ercAmountFromWei, ercSymbol })
    }else{
      this.setState({ ethAmountFromWei:0, ercAmountFromWei:0, ercSymbol:'' })
    }
  }



  sellPool = async () => {
    if(this.state.UniAmount > 0){
      // get additional data
      const factory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
      const poolExchangeAddress = await factory.methods.getExchange(this.props.tokenAddress).call()
      const exchangeERCContract = new this.props.web3.eth.Contract(ERC20ABI, poolExchangeAddress)
      const curBalance = await exchangeERCContract.methods.balanceOf(this.props.smartFundAddress).call()

      // check fun balance
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

  render() {
    return (
      <Form>
      <Form.Group>
      <Form.Label><small>Select your Uniswap pool token</small></Form.Label>
      <Form.Control
      type="number"
      min="0"
      placeholder="Uniswap pool amount"
      name="UniAmount"
      onChange={e => this.setState({ UniAmount:e.target.value })}
      />
      </Form.Group>
      <Button
      variant="outline-primary"
      type="button"
      onClick={() => this.sellPool()}
      >
      Sell
      </Button>

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

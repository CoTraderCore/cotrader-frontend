import React, { Component } from 'react'
import {
  SmartFundABIV5,
  UniswapFactoryABI,
  UniswapFactory,
  PoolPortalABI,
  PoolPortal
} from '../../../../config.js'
import { Form, Button } from "react-bootstrap"
import { toWei, fromWei, hexToNumberString } from 'web3-utils'

class BuyPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      ETHAmount:0,
      ERCAmount:0,
      ERCAmountFromWei:0
    }
  }

  calculate = async () => {
    if(this.state.ETHAmount > 0 && this.props.tokenAddress){
      const poolPortal = new this.props.web3.eth.Contract(PoolPortalABI, PoolPortal)
      const ERCAmount = await poolPortal.methods.getUniswapTokenAmountByETH(
        this.props.tokenAddress, toWei(this.state.ETHAmount)
      ).call()
      this.setState({
        ERCAmount: hexToNumberString(ERCAmount._hex),
        ERCAmountFromWei: fromWei(hexToNumberString(ERCAmount._hex))
      })
      console.log(this.state.ERCAmount, this.state.ERCAmountFromWei)
    }else{
      alert('Please fill all fields')
    }
  }

  buyPool = async () => {
    console.log("Amount:", this.state.ETHAmount)
    console.log("TokenAddress:", this.props.tokenAddress, typeof this.props.tokenAddress)
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
      placeholder="ETHAmount"
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

      <Button
      variant="outline-primary"
      type="button"
      onClick={() => this.buyPool()}
      >
      Buy
      </Button>
      </Form>
    )
  }

}

export default BuyPool

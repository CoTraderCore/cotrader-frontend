import React, { Component } from 'react'

import {
  SmartFundABIV5,
  UniswapFactoryABI,
  UniswapFactory
} from '../../../../config.js'

import { Form, Button } from "react-bootstrap"
import { toWei } from 'web3-utils'
import setPending from '../../../../utils/setPending'

class SellPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      UniAmount:0
    }
  }

  sellPool = async () => {
    if(this.state.UniAmount > 0){
      const factory = new this.props.web3.eth.Contract(UniswapFactoryABI, UniswapFactory)
      const poolExchangeAddress = await factory.methods.getExchange(this.props.tokenAddress).call()
      const fund = new this.props.web3.eth.Contract(SmartFundABIV5, this.props.smartFundAddress)
      const block = await this.props.web3.eth.getBlockNumber()

      // buy pool
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
      </Form>
    )
  }

}

export default SellPool

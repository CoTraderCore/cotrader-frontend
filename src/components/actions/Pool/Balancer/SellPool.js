import React, { PureComponent } from 'react'
import { Form, Button } from "react-bootstrap"
import setPending from '../../../../utils/setPending'
import { isAddress, toWei } from 'web3-utils'
import {
  BalancerPoolABI,
  SmartFundABIV7
} from '../../../../config.js'


class SellPool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      poolAmount:0,
      poolAddress:undefined
    }
  }

  sellBalancerPool = async () => {
    if(!isAddress(this.state.poolAddress)){
      alert("Wrong pool address")
    }
    else if (this.state.poolAmount <= 0) {
      alert("Wrong pool amount")
    }
    else {
      try{
        // prapare params data
        const poolAmount = toWei(this.state.poolAmount)

        const fundContract = new this.props.web3.eth.Contract(
          SmartFundABIV7,
          this.props.smartFundAddress
        )

        const BPool = new this.props.web3.eth.Contract(
          BalancerPoolABI,
          this.state.poolAddress
        )

        const poolConnectors = await BPool.methods.getCurrentTokens().call()

        const additionalData = this.props.web3.eth.abi.encodeParameters(
          ['uint256[]','uint256[]'],
          [poolConnectors, [1,1]]
        )

        // get block number
        const block = await this.props.web3.eth.getBlockNumber()
        // get gas price from local storage
        const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000



        // sell pool
        fundContract.methods.sellPool(
          poolAmount,
          2, // type Balancer
          this.state.poolAddress,
          [],
          additionalData
        )
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
      catch(e){
        alert('Can not verify transaction data, please try again in a minute')
      }
    }
  }

  render() {
    return (
      <Form>
        <Form.Group>
        <Form.Label>Balancer pool address</Form.Label>
        <Form.Control
        type="string"
        placeholder="Enter Balancer pool address"
        onChange={(e) => this.setState({ poolAddress:e.target.value })}
      />
      <br/>
      <Form.Label>Amount of pool for sell</Form.Label>
        <Form.Control
        type="string"
        placeholder="Enter Balancer pool amount"
        onChange={(e) => this.setState({ poolAmount:e.target.value })}/>
      </Form.Group>
      <Button variant="outline-primary" onClick={() => this.sellBalancerPool()}>Sell</Button>
      </Form>
    )
  }

}

export default SellPool

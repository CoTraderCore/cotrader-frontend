import React, { Component } from 'react'
import { Form, Button } from "react-bootstrap"
import { SmartFundABIV3, PoolPortalABI, PoolPortal } from '../../../config.js'

class BuyPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0
    }
  }

  calculatePool = async () => {
    const web3 = this.props.web3
    const poolPortal = new web3.eth.Contract(PoolPortalABI, PoolPortal)
    const connectors = await poolPortal.methods.getBancorConnectorsAmountByRelayAmount(
      this.props.fromAddress
    ).call()
    console.log(connectors)
  }

  buy = () => {

  }

  render() {
    return (
      <React.Fragment>
      <Form.Control
      placeholder="Enter amount for send"
      name="amount"
      onChange={(e) => this.setState({ amount: e.target.value })}
      type="number" min="1"/>
      <br/>
      <Button variant="outline-primary" onClick={() => this.calculatePool()}>Calculate</Button>
      <Button variant="outline-primary">Buy</Button>
      </React.Fragment>
    )
  }

}

export default BuyPool

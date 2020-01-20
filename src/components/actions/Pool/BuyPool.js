import React, { Component } from 'react'
import { Form, Button } from "react-bootstrap"
import { SmartFundABIV3 } from '../../../config.js'

class BuyPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0
    }
  }

  calculatePool = async () => {

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
      <Button variant="outline-primary">Buy</Button>
      </React.Fragment>
    )
  }

}

export default BuyPool

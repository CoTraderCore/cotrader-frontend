import React, { Component } from 'react'
import { Form, Button } from "react-bootstrap"
import { SmartFundABIV3, ERC20ABI } from '../../../config.js'
import { toWeiByDecimalsInput } from '../../../utils/toWeiByDecimalsInput'


class SellPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0
    }
  }

  sell = async () => {

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
      <Button variant="outline-primary">Sell</Button>
      </React.Fragment>
    )
  }

}

export default SellPool

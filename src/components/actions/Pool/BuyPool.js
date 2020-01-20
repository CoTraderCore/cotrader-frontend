import React, { Component } from 'react'
import { Form, Button } from "react-bootstrap"

class BuyPool extends Component {

  render() {
    return (
      <React.Fragment>
      <Form.Control
      placeholder="Enter amount for send"
      name="amount"
      type="number" min="1"/>
      <br/>
      <Button variant="outline-primary">Buy</Button>
      </React.Fragment>
    )
  }

}

export default BuyPool

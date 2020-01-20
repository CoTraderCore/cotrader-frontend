import React, { Component } from 'react'
import { Form, Button } from "react-bootstrap"


class SellPool extends Component {

  render() {
    return (
      <React.Fragment>
      <Form.Control
      placeholder="Enter amount for send"
      name="amount"
      type="number" min="1"/>
      <br/>
      <Button variant="outline-primary">Sell</Button>
      </React.Fragment>
    )
  }

}

export default SellPool

import React, { Component } from 'react'
import { Card, Row, Col } from "react-bootstrap"
import { fromWei } from 'web3-utils'

class UpgradableCard extends Component {
  constructor(props) {
   super(props);
    this.state = {
      profit:this.props.profit,
      value:this.props.value
    }
  }

  UpdateValue = (profit, value) => {
    this.setState({ profit, value });
  }

  render() {
  	return (
      <Card.Footer className="text-muted cardsAdditional">
        <Row>
        <Col>Fund profit: { fromWei(this.state.profit) }</Col>
        <Col>Fund value: { fromWei(this.state.value) }</Col>
        </Row>
      </Card.Footer>
    )
  }
}

export default UpgradableCard

import React, { Component } from 'react'
import { Row, Col, Badge } from "react-bootstrap"

class Footer extends Component {
  render() {
    return (
      <Row className="footer">
      <Col><h5><Badge>Since 2018: world's first live EthFi investments funds marketplace</Badge></h5></Col>
      </Row>
    )
  }
}

export default Footer

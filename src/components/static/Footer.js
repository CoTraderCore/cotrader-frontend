import React, { Component } from 'react'
import { Row, Col, Badge } from "react-bootstrap"

class Footer extends Component {
  render() {
    return (
      <Row className="footer">
      <Col><h5><Badge>2018 - 2019</Badge></h5></Col>
      </Row>
    )
  }
}

export default Footer

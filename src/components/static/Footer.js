import React, { Component } from 'react'
import { Row, Col, Badge } from "react-bootstrap"

class Footer extends Component {
  render() {
    return (
      <Row className="footer">
      <Col><h5><Badge>2018 to eternity: let freedom ring</Badge></h5></Col>
      </Row>
    )
  }
}

export default Footer

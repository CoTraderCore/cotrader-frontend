import React, { Component } from 'react'
import { Nav, OverlayTrigger, Tooltip } from "react-bootstrap"
import { inject, observer } from 'mobx-react'

class FundsNav extends Component {
 render(){
    return(
      <Nav className="justify-content-center" variant="tabs">
      <Nav.Item>
      <Nav.Link onClick={() => this.props.MobXStorage.AllFunds()}>All funds</Nav.Link>
      </Nav.Item>
      <Nav.Item>
      {
        this.props.MobXStorage.web3
        ?
        (
          <Nav.Link onClick={() => this.props.MobXStorage.myFunds(this.props.MobXStorage.account[0])}>My funds</Nav.Link>
        )
        :
        (
        <OverlayTrigger
          overlay={
          <Tooltip>
          Please connect to web3
          </Tooltip>
          }
          >
          <Nav.Link>My funds</Nav.Link>
          </OverlayTrigger>
        )
      }

      </Nav.Item>
      {
        this.props.MobXStorage.web3 ?
        (
          <Nav.Link onClick={() => this.props.MobXStorage.myInvestments(this.props.MobXStorage.account[0])}>My investments</Nav.Link>
        )
        :
        (
          <OverlayTrigger
          overlay={
          <Tooltip>
          Please connect to web3
          </Tooltip>
          }
          >
          <Nav.Link>My investments</Nav.Link>
          </OverlayTrigger>
        )
      }
      </Nav>
    )
  }
}
export default inject('MobXStorage')(observer(FundsNav));

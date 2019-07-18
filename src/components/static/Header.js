import React, { Component } from 'react'
import { Navbar, Nav, NavDropdown, Card } from "react-bootstrap"
import { NavLink } from 'react-router-dom'
import { LinkContainer } from "react-router-bootstrap"
class Header extends Component {
  render() {
    return (
    <React.Fragment>
    <Navbar collapseOnSelect expand="lg" bg="light" variant="light">
    <Navbar.Brand>
    {
      !this.props.web3 ?(
        <NavLink to="/web3off"><img style={{width: '120px', height: '30px'}} src="/header-logo.png" alt="CoTrader"/></NavLink>
      )
      :
      (
        <NavLink to="/"><img style={{width: '120px', height: '30px'}} src="/header-logo.png" alt="CoTrader"/></NavLink>
      )
    }
    </Navbar.Brand>
    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
    <Navbar.Collapse id="responsive-navbar-nav">
    <Nav className="mr-auto">
      <Nav.Link href="https://about.cotrader.com/" target="_blank">About</Nav.Link>
      <Nav.Link href="https://www.youtube.com/watch?v=COzhJr73fM4" target="_blank">Video</Nav.Link>

      <LinkContainer to="/how-to-start">
      <Nav.Link>How to start</Nav.Link>
      </LinkContainer>

      <LinkContainer to="/stake">
      <Nav.Link>Stake COT</Nav.Link>
      </LinkContainer>

      <NavDropdown title="Buy COT" id="collasible-nav-dropdown">
        <NavDropdown.Item href="https://www.hotbit.io/" target="_blank">Hotbit</NavDropdown.Item>
        <NavDropdown.Item href="https://www.bancor.network/" target="_blank">Bancor</NavDropdown.Item>
        <NavDropdown.Item href="https://idex.market/eth/idex" target="_blank">Idex</NavDropdown.Item>
      </NavDropdown>

      <NavDropdown title="Social Links" id="collasible-nav-dropdown">
        <NavDropdown.Item href="https://t.me/cotrader" target="_blank">Telegram</NavDropdown.Item>
        <NavDropdown.Item href="https://twitter.com/cotrader_com" target="_blank">Twitter</NavDropdown.Item>
      </NavDropdown>
    </Nav>
    </Navbar.Collapse>
    </Navbar>
    <Card className="text-center">
    <small>World's first non-custodial crypto investments funds marketplace - create or join the best smart funds</small>
    </Card>
    </React.Fragment>
    )
  }
}

export default Header

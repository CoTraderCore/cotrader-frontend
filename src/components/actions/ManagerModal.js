import React, { Component } from 'react'
import { Button, Modal } from "react-bootstrap"
import { EtherscanLink }  from '../../config.js'
import { NavLink } from 'react-router-dom'
import { inject } from 'mobx-react'

class ManagerModal extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      Show: false,
    }
  }

  getManagerFunds(){
    this.props.MobXStorage.searchFundByManager(this.props.address)
    this.setState({ Show: false })
  }


  render() {
    let modalClose = () => this.setState({ Show: false });

    return (
      <div>
        <Button style={{minWidth: "200px", maxWidth: "200px"}} variant="outline-primary" onClick={() => this.setState({ Show: true })}>
          Manager: { this.props.address ? this.props.address.slice(0, -31) : null }
        </Button>

        <Modal
          show={this.state.Show}
          onHide={modalClose}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-sm">
          View manager info
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <Button variant="outline-primary" onClick={() => this.getManagerFunds()}>Search all funds of this manager</Button>
          <NavLink to={"/user-txs/"+this.props.address}><Button variant="outline-primary">Get all txs</Button></NavLink>
          <Button variant="outline-primary" href={EtherscanLink + "address/" + this.props.address} target="_blank" rel="noopener noreferrer">Etherscan</Button>
          </Modal.Body>
          <Modal.Footer>
          Address: {this.props.address}
          </Modal.Footer>
        </Modal>

      </div>
    )
  }
}

export default inject('MobXStorage')((ManagerModal));

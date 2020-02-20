import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
//import { NeworkID } from '../../config.js'
//import axios from 'axios'
//import { Typeahead } from 'react-bootstrap-typeahead'


class PoolModal extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      symbols: []
    }
  }

  _isMounted = false
  componentDidMount(){
    this._isMounted = true
    this.initData()

  }

  componentWillUnmount(){
    this._isMounted = false
  }

  initData = async () => {
    console.log("Init data")
  }

  compoundMint = () => {

  }

  compoundRedeem = async () => {

  }

  compoundRedeemUnderlying = async () => {

  }

  modalClose = () => this.setState({ Show: false })
  render() {
    return (
      <React.Fragment>
      <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
        Loan
      </Button>

      <Modal
        show={this.state.Show}
        onHide={() => this.modalClose()}
      >
        <Modal.Header closeButton>
        <Modal.Title>
        Loan
        </Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form>
        <Form.Group>
        <Form.Label>Amount of {this.props.mainAsset}</Form.Label>
        <Form.Control
        type="number"
        min="0"
        placeholder="Amount"
        name="DepositValue"
        />

        </Form.Group>
        <Button
        variant="outline-primary"
        type="button"
        >
        Deposit
        </Button>
        </Form>
        </Modal.Body>
      </Modal>

      </React.Fragment>
    )
  }
}

export default PoolModal

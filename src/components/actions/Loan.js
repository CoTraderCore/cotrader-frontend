import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
import { NeworkID } from '../../config.js'
//import axios from 'axios'
import { Typeahead } from 'react-bootstrap-typeahead'


class PoolModal extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      symbols: [],
      tokens:[],
      action:'Loan'
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
    if(NeworkID === 3){
      const symbols = ['cDAI', 'cETH']
      const tokens =  [
        {'cDAI':'0x6ce27497a64fffb5517aa4aee908b1e7eb63b9ff'},
        {'cETH':'0x1d70b01a2c3e3b2e56fcdcefe50d5c5d70109a5d'}]

      this.setState({ symbols, tokens })
    }else{
      alert('TODO: load data from compound api')
    }
  }

  findAddressBySymbol = (symbol) => {
    const address = this.state.tokens.map(item => item[symbol])
    return address[0]
  }

  compoundMint = () => {
    console.log("Mint")
  }

  compoundRedeem = async () => {
    console.log("Redeem")
  }

  compoundRedeemUnderlying = async () => {
    console.log("RedeemUnderlying")
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.action !== this.state.action){
      console.log(this.state.action)
    }
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
        <Form.Group controlId="exampleForm.ControlSelect1">
        <Form.Label>Select Compound action</Form.Label>
        <Form.Control
         as="select"
         size="sm"
         onChange={(e) => this.setState({ action:e.target.value })}
         >
          <option>Loan</option>
          <option>Redeem</option>
          <option>Redeem underlying</option>
        </Form.Control>
        </Form.Group>

        <Typeahead
          labelKey="compoundSymbols"
          multiple={false}
          id="compoundSymbols"
          options={this.state.symbols}
          onChange={(s) => this.setState({tokenAddress: this.findAddressBySymbol(s[0])})}
          placeholder="Choose a symbol"
        />
        <br/>

        <Form.Group>
        <Form.Control
        type="number"
        min="0"
        placeholder="Enter amount"
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

import React, { Component } from 'react'
import { SmartFundABI } from '../../config.js'
import { Button, Modal, Form, Alert } from "react-bootstrap"
import setPending from '../../utils/setPending'

class Deposit extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      Show: false,
      Agree: false,
      DepositValue:0,
      ValueError: false
    }
  }

  validation(address, _value){
    if( _value <= 0){
    this.setState({ ValueError:true })
    }else{
    if(this.state.ValueError){
    this.setState({ ValueError:false })
    }
    this.deposit(address, _value)
  }
  }

  deposit = async (address, _value) => {
  const contract = new this.props.web3.eth.Contract(SmartFundABI, address)
  const amount = this.props.web3.utils.toWei(_value, 'ether');

  this.modalClose()
  let block = await this.props.web3.eth.getBlockNumber()

  contract.methods.deposit().send({ from: this.props.accounts[0], value:amount})
  .on('transactionHash', (hash) => {
  console.log(hash)
  // pending status for spiner
  this.props.pending(true)
  // pending status for DB
  setPending(address, 1, this.props.accounts[0], block, hash, "Deposit")
  })
  }

  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }
  modalClose = () => this.setState({ Show: false, Agree: false });

  render() {
    return (
      <div>
        <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
          Deposit
        </Button>

        <Modal
          show={this.state.Show}
          onHide={this.modalClose}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
            <Modal.Title id="example-modal-sizes-title-sm">
              Terms and Conditions
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <p>1. I certify that I'm not a USA citizen or resident.</p>
          <p>2. I understand CoTrader technology is new and is not to be trusted.</p>
          <p>3. I understand that CoTrader aims to protect investors with technology regulation, that aims to prove fees, fair play, and past performance.</p>
          <p>4. I understand I shouldn't deposit anything I can't afford to lose.</p>
          <Form.Check type="checkbox"
           label="I agree to the above Terms and Conditions to use this product. By cancelling you will not gain access to the service."
           onChange={() => this.setState({ Agree: !this.state.Agree})}
           />
          {
            this.state.Agree ? (
              <div>
              <br/>
              <Form>
              <Form.Group>
              <Form.Label>Amount of ETH</Form.Label>
              <Form.Control
              type="number"
              min="0"
              placeholder="Amount"
              name="DepositValue"
              onChange={e => this.change(e)}
              />
              {
                this.state.ValueError ? (
                  <Alert variant="danger">Value can't be 0 or less</Alert>
                ) : (null)
              }
              </Form.Group>
              <Button
              variant="outline-primary"
              type="button"
              onClick={() => this.validation(this.props.address, this.state.DepositValue)}
              >
              Deposit
              </Button>
              </Form>
              </div>
            ) : (null)
          }
          </Modal.Body>
        </Modal>

      </div>
    )
  }
}

export default Deposit

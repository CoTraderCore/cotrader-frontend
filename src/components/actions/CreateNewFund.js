import React, { Component } from 'react'
import { SmartFundRegistryABI, SmartFundRegistryADDRESS } from '../../config.js'
import { Button, Modal, Form, InputGroup } from "react-bootstrap"

import UserInfo from '../templates/UserInfo'

class CreateNewFund extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      Show: false,
      Percent: 20,
      FundName: ''
    }
  }

  createNewFund = async (name, percent) =>{
  if(percent > 0 && percent <= 100){
  const contract = new this.props.web3.eth.Contract(SmartFundRegistryABI, SmartFundRegistryADDRESS)
  try {
    this.setState({ Show:false })
    this.props.pending(true)
    await contract.methods.createSmartFund(name, percent).send({ from: this.props.accounts[0] })
  } catch (e) {
    this.props.pending(false)
  }
  }
  }

  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render() {
    let modalClose = () => this.setState({ Show: false });

    return (
      <div>
        <Button variant="outline-primary" onClick={() => this.setState({ Show: true })}>
          Create new fund
        </Button>

        <Modal
          show={this.state.Show}
          onHide={modalClose}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-sm">
          Create new fund
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <Form>

          <Form.Group>
          <Form.Label>Fund name</Form.Label>
          <Form.Control
          type="text"
          placeholder="name"
          name="FundName"
          onChange={e => this.change(e)} />
          </Form.Group>

          <Form.Group>
          <Form.Label>Performance Fee % <UserInfo  info="This is the % the fund manager earns for the profits earned, relative to ETH. In the near future, we will add an option for realitive to USD, or DAI."/></Form.Label>
          <InputGroup>
          <InputGroup.Prepend>
          <InputGroup.Text id="inputGroupPrepend">%</InputGroup.Text>
          </InputGroup.Prepend>
           <Form.Control
           type="number"
           placeholder="20"
           aria-describedby="inputGroupPrepend"
           min="1"
           name="Percent"
           onChange={e => this.change(e)} />

           </InputGroup>
           </Form.Group>
           <Button
           variant="outline-primary"
           type="button"
           onClick={() => this.createNewFund(this.state.FundName, this.state.Percent)}
           >
           Create
           </Button>
          </Form>
          </Modal.Body>
        </Modal>

      </div>
    )
  }
}

export default CreateNewFund

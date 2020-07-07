import React, { Component } from 'react'
import { Form, Button, Modal, Alert } from "react-bootstrap"
import duration from '../../../utils/duration'


class Deposit extends Component{
  constructor(props, context) {
    super(props, context);

    this.state = {
      Show: false,
      Value: 0,
      Days: 0,
      ReturnRewards:0
    }
  }

  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  modalClose = () => {
    this.setState({ Show: false, Value:0, Days:0, ReturnRewards:0 });
  }

  Calculate = async () => {
    if(this.state.Value > 0 && this.state.Days !== null && this.state.Days > 0){
      const tokens = this.props.web3.utils.toWei(String(this.state.Value))
      const time = duration.days(this.state.Days)
      const data = await this.props.stakeContract.methods.calculateWithdarw(tokens, time).call()
      const ReturnRewards = Number(this.props.web3.utils.fromWei(String(this.props.web3.utils.hexToNumberString(data._hex))))
      this.setState({ReturnRewards})
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    if(prevState.Value !== this.state.Value || prevState.Days !== this.state.Days){
      this.Calculate()
    }
  }

  Deposit = async () => {
  if(this.state.Value > Number(this.props.freeReserve)){
    alert("Sorry contract doesn't have free reserve for your input")
  }
  else if (this.state.Days === null && typeof this.state.Days !== "number"){
    alert("Please select percent")
  }
  else if(this.state.Value <= 0){
    alert("Please input correct value")
  }
  else{
    const time = duration.days(this.state.Days)
    await this.props.stakeContract.methods.deposit(this.props.web3.utils.toWei(String(this.state.Value)), time).send(
      {
        from: this.props.account
      }
    ).on('transactionHash', (hash) => {
      this.modalClose()
    })
  }
  }

  render(){
    return(
    <React.Fragment>
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
      <small>Deposit some amount of token to stake contract</small>
      </Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <Form>
      <Form.Label>Please input tokens amount for stake</Form.Label>
      <Form.Group controlId="Deposit">
     <Form.Control type="number" min="1" name="Value" onChange={e => this.change(e)}/>
     </Form.Group>
     <Form.Group controlId="DepositSelect">
      <Form.Label>Please select time in days for stake</Form.Label>
      <Form.Control as="select" name="Days" onChange={e => this.change(e)}>
      <option>...</option>
      <option>90</option>
      <option>180</option>
      <option>365</option>
      <option>730</option>
      <option>1095</option>
      </Form.Control>
    </Form.Group>
    {
      this.state.ReturnRewards > 0
      ?
      (
        <Alert variant="primary">You will recive: {this.state.ReturnRewards}</Alert>
      )
      :(null)
    }
     </Form>
     <Button variant="outline-primary" onClick={() => this.Deposit()}>Deposit</Button>
     </Modal.Body>
   </Modal>
</React.Fragment>
  )
}
}

export default Deposit

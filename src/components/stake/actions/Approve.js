import React, { Component } from 'react'
import { Form, Button, Modal} from "react-bootstrap"

class Approve extends Component{
  constructor(props, context) {
    super(props, context);

    this.state = {
      Show: false,
      Value: 0
    }
  }

  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  Approve = async () => {
    if(this.state.Value > Number(this.props.freeReserve)){
      alert("Sorry contract doesn't have free reserve for your input")
    }
    else if(this.state.Value > 0){
      this.setState({ Show: false })
      this.props.tokenContract.methods.approve(this.props.spender, this.props.web3.utils.toWei(String(this.state.Value))).send(
        {
          from: this.props.account
        }
      )
    }else{
      alert("Please input correct value")
    }
  }


  render(){
    let modalClose = () => this.setState({ Show: false });
    return(
    <React.Fragment>
    <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
      Approve
    </Button>

    <Modal
      show={this.state.Show}
      onHide={modalClose}
      aria-labelledby="example-modal-sizes-title-sm"
    >
      <Modal.Header closeButton>
      <Modal.Title id="example-modal-sizes-title-sm">
      <small>Approve some amount of token to stake contract</small>
      </Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <Form>
      <Form.Group controlId="approve">
      <Form.Label>Please input tokens amount for approve to stake contract</Form.Label>
     <Form.Control type="number" min="1" name="Value" onChange={e => this.change(e)}/>
     </Form.Group>
     </Form>
     <Button variant="outline-primary" onClick={() => this.Approve()}>Approve</Button>
     </Modal.Body>
   </Modal>
</React.Fragment>
  )
}
}

export default Approve

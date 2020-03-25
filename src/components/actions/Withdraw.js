import React, { Component } from 'react'
import { SmartFundABI } from '../../config.js'
import { Button, Modal, Form } from "react-bootstrap"
import setPending from '../../utils/setPending'

class Withdraw extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      Percent: 50
    }
  }

  withdraw = async (address, percent) => {
  if(percent >= 0 && percent <= 100){
  const contract = new this.props.web3.eth.Contract(SmartFundABI, address)
  const totalPercentage = await contract.methods.TOTAL_PERCENTAGE().call()
  const curentPercent = totalPercentage / 100 * percent

  this.setState({ Show:false })

  const block = await this.props.web3.eth.getBlockNumber()

  contract.methods.withdraw(curentPercent).send({ from: this.props.accounts[0] })
  .on('transactionHash', (hash) => {
  // pending status for spiner
  this.props.pending(true)
  // pending status for DB
  setPending(address, 1, this.props.accounts[0], block, hash, "Withdraw")
   })
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
        <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
          Withdraw
        </Button>

        <Modal
          show={this.state.Show}
          onHide={modalClose}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-sm">
          Withdraw from smart fund
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <Form>
           <Form.Group controlId="formBasicRange">
             <Form.Label>Percent {this.state.Percent} %</Form.Label>
             <Form.Control
             type="range"
             value={this.state.Percent}
             min="1"
             name="Percent"
             max="100"
             onChange={e => this.change(e)}
             />
           </Form.Group>
           <Button
           variant="outline-primary"
           type="button"
           onClick={() => this.withdraw(this.props.address, this.state.Percent)}
           >
           Withdraw
           </Button>
          </Form>
          </Modal.Body>
        </Modal>

      </div>
    )
  }
}

export default Withdraw

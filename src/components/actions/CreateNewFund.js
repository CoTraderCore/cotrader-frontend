import React, { Component } from 'react'
import { SmartFundRegistryABI, SmartFundRegistryADDRESS } from '../../config.js'
import { Modal, Form } from "react-bootstrap"

import UserInfo from '../templates/UserInfo'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'

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
        <Button variant="contained" color="primary" onClick={() => this.setState({ Show: true })}>
          Create fund
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
          <TextField
            id="outlined-name"
            label="Fund name"
            value={this.state.searchByName}
            name="FundName"
            onChange={e => this.change(e)}
            margin="normal"
            variant="outlined"
            style={{width:'100%'}}
          />
          </Form.Group>


          <Form.Group>
          <Form.Label>Performance Fee % <UserInfo  info="This is the % the fund manager earns for the profits earned, relative to ETH. In the near future, we will add an option for realitive to USD, or DAI."/></Form.Label>
          <TextField
            id="outlined-name"
            label="Performance Fee"
            value={this.state.searchByName}
            name="Percent"
            onChange={e => this.change(e)}
            margin="normal"
            variant="outlined"
            type="number"
            placeholder="20"
            style={{width:'100%'}}
            InputProps={{
              inputProps: { min: 1 },
              startAdornment: (
                <InputAdornment position="start">
                  %
                </InputAdornment>
              ),
            }}
          />
          </Form.Group>


           <Button variant="contained" color="primary" onClick={() => this.createNewFund(this.state.FundName, this.state.Percent)}
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

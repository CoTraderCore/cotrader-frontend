import React, { Component } from 'react'
import {
  SmartFundRegistryABIV4,
  SmartFundRegistryADDRESS
} from '../../config.js'
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
      FundAsset: 'ETH',
      FundName: ''
    }
  }

  createNewFund = async () =>{
  if(this.state.Percent > 0 && this.state.Percent <= 100){
  const contract = new this.props.web3.eth.Contract(SmartFundRegistryABIV4, SmartFundRegistryADDRESS)
    if(this.state.FundName !== ''){
      try{
        this.props.pending(true)
        const isUSDFund = this.state.FundAsset === "USD" ? true : false
        const name = this.state.FundName
        const percent = this.state.Percent
        this.modalClose()
        console.log(name, percent, isUSDFund)
        await contract.methods.createSmartFund(name, percent, isUSDFund)
        .send({ from: this.props.accounts[0] })
      }catch(e){
        // for case if user reject transaction
        this.props.pending(false)
      }
    }else{
      alert('Please input fund name')
    }
  }else{
    alert('Please select correct percent')
  }
  }

  // helper for set state
  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  modalClose = () => {
    this.setState({ Show: false, Percent: 20, FundAsset: 'ETH', FundName: '' })
  }

  render() {
    return (
      <div>
        <Button variant="contained" color="primary" onClick={() => this.setState({ Show: true })}>
          Create fund
        </Button>

        <Modal
          show={this.state.Show}
          onHide={() => this.modalClose()}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-sm">
          Create new fund <small>(with multi DEX support)</small>
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
          <Form.Label>Performance Fee % <UserInfo  info="This is the % the fund manager earns for the profits earned, relative to ETH. In the near future, we will add an option for relative to USD, or DAI."/></Form.Label>
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

          <Form.Group controlId="exampleForm.ControlSelect1">
          <Form.Label>Main fund asset % <UserInfo  info="With the help of this asset, investors will invest, calculate fund value ect"/></Form.Label>
          <Form.Control as="select" name="FundAsset" onChange={e => this.change(e)}>
            <option>ETH</option>
            <option>USD</option>
          </Form.Control>
          </Form.Group>

           <Button
           variant="contained"
           color="primary"
           onClick={() => this.createNewFund()}
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

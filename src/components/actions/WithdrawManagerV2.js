// For Oracle based funds

import React, { Component } from 'react'
import { SmartFundABI, SmartFundABIV6, APIEnpoint } from '../../config.js'
import setPending from '../../utils/setPending'
import axios from 'axios'
import { Button, Modal, Form } from "react-bootstrap"
import { fromWei } from 'web3-utils'
import checkDWFrezeeTime from '../../utils/checkDWFrezeeTime'


class WithdrawManager extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      isConvert: false,
      DWFrezee: false,
      DWDate: null,
      DWUpdated: false
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(this.state.Show && !this.state.DWUpdated)
      this.checkDWFrezeeTime()
  }

  // for version 8 and newest
  checkDWFrezeeTime = async () => {
    setTimeout(async () => {
      if(this.props.version > 7){
        const {
          DWFrezee,
          DWDate
        } = await checkDWFrezeeTime(this.props.smartFundAddress, this.props.web3)
        this.setState({ DWFrezee, DWDate, DWUpdated:true })
      }
    },100)
  }

  // take cut action
  withdrawManager = async () => {
    try{
      // get correct ABI for a certain version
      // Only v6 can try convert assets
      const contractABI = this.props.version === 6 ? SmartFundABIV6 : SmartFundABI
      const contract = new this.props.web3.eth.Contract(contractABI, this.props.smartFundAddress)
      const block = await this.props.web3.eth.getBlockNumber()

      // get cur tx count
      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + this.props.accounts[0])
      txCount = txCount.data.result

      // check correct call for a certain version
      if(this.props.version === 6){
        contract.methods.fundManagerWithdraw(this.state.isConvert).send({ from: this.props.accounts[0]})
        .on('transactionHash', (hash) => {
          this.updatePendingStatus(txCount, block, hash)
        })
      }else{
        contract.methods.fundManagerWithdraw().send({ from: this.props.accounts[0]})
        .on('transactionHash', (hash) => {
          this.updatePendingStatus(txCount, block, hash)
        })
      }
    }
    catch(e){
     alert('Can not verify transaction data, please try again in a minute')
    }
  }

  // update pending status after recieve hash
  updatePendingStatus(txCount, block, hash){
    // pending status for spiner
    this.props.pending(true, txCount+1)
    // pending status for DB
    setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Withdraw")
    // close modal
    this.modalClose()
  }

  // close modal
  modalClose = () => this.setState({ Show: false, isConvert: false, DWUpdated:false })

  render() {
    return (
      <div>
        <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
          Take cut
        </Button>

        <Modal
          show={this.state.Show}
          onHide={() => this.modalClose()}
        >
          <Modal.Header closeButton>
          <Modal.Title>
          Take cut from smart fund
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <p>Please update fund value</p>

          <Form>
           <Form.Group>
           {
             !this.state.DWFrezee
             ?
             (
               <Button
               variant="outline-primary"
               type="button"
               onClick={() => this.withdrawManager()}
               >
               Take cut
               </Button>
             )
             :
             <>
             <small>Next withdraw will be able </small>
             { this.state.DWDate }
             </>
           }
           </Form.Group>
          </Form>
          </Modal.Body>
        </Modal>

      </div>
    )
  }
}

export default WithdrawManager

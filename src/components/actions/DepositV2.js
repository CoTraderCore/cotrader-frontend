// For Oracle based funds

import React, { Component } from 'react'

import {
  SmartFundABI,
  SmartFundABIV4,
  SmartFundABIV7,
  ERC20ABI,
  APIEnpoint
} from '../../config.js'
import { fromWei } from 'web3-utils'
import { Button, Modal, Form, Alert } from "react-bootstrap"
import setPending from '../../utils/setPending'
import { toWeiByDecimalsInput } from '../../utils/weiByDecimals'
import axios from 'axios'
import DWOracleWrapper from './DWOracleWrapper'


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
    }
    else{
      if(this.props.mainAsset === 'ETH'){
        this.depositETH(address, _value)
      }else{
        this.depositERC20(address, _value)
      }
    }
  }


  depositETH = async (address, _value) => {
    try{
      const contract = new this.props.web3.eth.Contract(SmartFundABI, address)
      const amount = this.props.web3.utils.toWei(_value, 'ether')
      const userWalletBalance = await this.props.web3.eth.getBalance(this.props.accounts[0])

      if(parseFloat(fromWei(String(userWalletBalance))) >= parseFloat(fromWei(String(amount)))){
        // get cur tx count
        let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + this.props.accounts[0])
        txCount = txCount.data.result

        this.modalClose()
        let block = await this.props.web3.eth.getBlockNumber()

        contract.methods.deposit().send({ from: this.props.accounts[0], value:amount})
        .on('transactionHash', (hash) => {
        // pending status for spiner
        this.props.pending(true, txCount+1)
        // pending status for DB
        setPending(address, 1, this.props.accounts[0], block, hash, "Deposit")
        })
      }
      else{
        alert('Not enough balance for deposit')
      }
    }catch(e){
      alert("Can not verify transaction data, please try again in a minute")
    }
  }


  depositERC20 = async (address, _value) => {
    try{
      let contract
      let ercAssetAddress

      console.log("this.props.version",this.props.version)

      // get core asset dependse of version
      if(this.props.version >= 6){
        console.log("v7")
        contract = new this.props.web3.eth.Contract(SmartFundABIV7, address)
        ercAssetAddress = await contract.methods.coreFundAsset().call()
      }else{
        console.log("vOld")
        contract = new this.props.web3.eth.Contract(SmartFundABIV4, address)
        ercAssetAddress = await contract.methods.stableCoinAddress().call()
      }

      const ercAssetContract = new this.props.web3.eth.Contract(ERC20ABI, ercAssetAddress)
      const ercAssetDecimals = await ercAssetContract.methods.decimals().call()
      const userWalletBalance = await ercAssetContract.methods.balanceOf(this.props.accounts[0]).call()
      const amount = toWeiByDecimalsInput(ercAssetDecimals, _value)

      if(parseFloat(fromWei(String(userWalletBalance))) >= parseFloat(fromWei(String(amount)))){
        // get cur tx count
        let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + this.props.accounts[0])
        txCount = txCount.data.result

        let block = await this.props.web3.eth.getBlockNumber()

        // Approve ERC to smart fund
        const approveData = ercAssetContract.methods.approve(
          address,
          amount
        ).encodeABI({from: this.props.accounts[0]})

        const approveTx = {
          "from": this.props.accounts[0],
          "to": ercAssetAddress,
          "value": "0x0",
          "data": approveData,
          "gasPrice": this.props.web3.eth.utils.toHex(5000000000),
          "gas": this.props.web3.eth.utils.toHex(85000),
        }

        // Deposit
        const depositData = contract.methods.deposit(amount)
        .encodeABI({from: this.props.accounts[0]})

        const depositTx = {
          "from": this.props.accounts[0],
          "to": address,
          "value": "0x0",
          "data": depositData,
          "gasPrice": this.props.web3.eth.utils.toHex(5000000000),
          "gas": this.props.web3.eth.utils.toHex(285000),
        }

        // Craete Batch request
        let batch = new this.props.web3.BatchRequest()
        batch.add(this.props.web3.eth.sendTransaction.request(approveTx, () => console.log("Approve")))
        batch.add(this.props.web3.eth.sendTransaction.request(depositTx, (status, hash) => {
        // pending status for spiner
        this.props.pending(true, txCount+2)
        // pending status for DB
        setPending(address, 1, this.props.accounts[0], block, hash, "Deposit")
        }))

        batch.execute()

        this.modalClose()
      }else{
        alert('Not enough balance for deposit')
      }
    }
    catch(e){
    alert("Can not verify transaction data, please try again in a minute")
    console.log("err: ",e)
    }
 }

 modalClose = () => this.setState({ Show: false, Agree: false, DWUpdated:false });

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
              <Form.Label>Amount of {this.props.mainAsset}</Form.Label>
              <Form.Control
              type="number"
              min="0"
              placeholder="Amount"
              name="DepositValue"
              onChange={e => this.setState({ DepositValue:e.target.value })}
              />
              {
                this.state.ValueError ? (
                  <Alert variant="danger">Value can't be 0 or less</Alert>
                ) : (null)
              }
              </Form.Group>

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

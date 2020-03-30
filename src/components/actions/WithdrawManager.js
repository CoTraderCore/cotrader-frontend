import React, { Component } from 'react'
import { Button } from "react-bootstrap"
import { SmartFundABI, APIEnpoint } from '../../config.js'
import setPending from '../../utils/setPending'
import axios from 'axios'


class WithdrawManager extends Component {
  WithdrawManager = async () =>{
    const contract = new this.props.web3.eth.Contract(SmartFundABI, this.props.smartFundAddress)
    const block = await this.props.web3.eth.getBlockNumber()
    // get cur tx count
    let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + this.props.accounts[0])
    txCount = txCount.data.result

    contract.methods.fundManagerWithdraw().send({ from: this.props.accounts[0]})
    .on('transactionHash', (hash) => {
    // pending status for spiner
    this.props.pending(true, txCount+1)
    // pending status for DB
    setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Withdraw")
    })
  }

  render() {
    return (
    <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.WithdrawManager()}>Take cut</Button>
    )
  }
}

export default WithdrawManager

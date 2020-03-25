import React, { Component } from 'react'
import { Button } from "react-bootstrap"
import { SmartFundABI } from '../../config.js'
import setPending from '../../utils/setPending'


class WithdrawManager extends Component {
  WithdrawManager = async () =>{
    const contract = new this.props.web3.eth.Contract(SmartFundABI, this.props.smartFundAddress)
    const block = await this.props.web3.eth.getBlockNumber()
    try{
      this.props.pending(true)
      await contract.methods.fundManagerWithdraw().send({ from: this.props.accounts[0]})
      .on('transactionHash', (hash) => {
      // pending status for spiner
      this.props.pending(true)
      // pending status for DB
      setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Withdraw")
      })
    }catch(e){
      console.log(e)
      this.props.pending(false)
    }
  }

  render() {
    return (
    <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.WithdrawManager()}>Take cut</Button>
    )
  }
}

export default WithdrawManager

import React, { Component } from 'react'
import { Button } from "react-bootstrap"
import { SmartFundABI } from '../../config.js'

class WithdrawManager extends Component {
  WithdrawManager = async () =>{
    const contract = new this.props.web3.eth.Contract(SmartFundABI, this.props.smartFundAddress)
    try{
      this.props.pending(true)
      await contract.methods.fundManagerWithdraw().send({ from: this.props.accounts[0]})
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

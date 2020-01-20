import React, { Component } from 'react'
import { Form, Button } from "react-bootstrap"
import { SmartFundABIV3, ERC20ABI } from '../../../config.js'
import { toWeiByDecimalsInput } from '../../../utils/weiByDecimals'


class SellPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0
    }
  }

  sell = async () => {
    if(this.props.fromAddress.length > 0 && this.state.amount > 0){
      const web3 = this.props.web3
      // Get amount in wei by decimals
      const token = new web3.eth.Contract(ERC20ABI, this.props.fromAddress)
      const decimals = await token.methods.decimals().call()
      const amountInWei = toWeiByDecimalsInput(decimals, this.state.amount)

      // Sell
      const fund = new web3.eth.Contract(SmartFundABIV3, this.props.smartFundAddress)
      fund.methods.sellPool(amountInWei, 1, this.props.fromAddress, []).send({ from:this.props.accounts[0] })
    }else{
      alert('Please fill in all fields')
    }
  }

  render() {
    return (
      <React.Fragment>
      <Form.Control
      placeholder="Enter amount for send"
      name="amount"
      onChange={(e) => this.setState({ amount: e.target.value })}
      type="number" min="1"/>
      <br/>
      <Button variant="outline-primary" onClick={() => this.sell()}>Sell</Button>
      </React.Fragment>
    )
  }

}

export default SellPool

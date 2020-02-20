import React, { Component } from 'react'
import { Form, Button } from "react-bootstrap"
import { SmartFundABIV4, ERC20ABI } from '../../../../config.js'
import { toWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import setPending from '../../../../utils/setPending'


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
      const block = await web3.eth.getBlockNumber()

      // Get amount in wei by decimals
      const token = new web3.eth.Contract(ERC20ABI, this.props.fromAddress)
      const decimals = await token.methods.decimals().call()
      const amountInWei = toWeiByDecimalsInput(decimals, this.state.amount)

      // Sell
      const fund = new web3.eth.Contract(SmartFundABIV4, this.props.smartFundAddress)
      fund.methods.sellPool(amountInWei, 0, this.props.fromAddress, []).send({ from:this.props.accounts[0] })
      .on('transactionHash', (hash) => {
      // pending status for spiner
      this.props.pending(true)
      // pending status for DB
      setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
      })

      // close pool modal
      this.props.modalClose()
    }else{
      alert('Please fill in all fields')
    }
  }

  render() {
    return (
      <React.Fragment>
      <Form.Control
      placeholder="Enter amount"
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

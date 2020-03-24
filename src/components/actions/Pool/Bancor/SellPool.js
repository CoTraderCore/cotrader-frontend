import React, { Component } from 'react'
import { Alert, Form, Button } from "react-bootstrap"

import {
  SmartFundABIV4,
  ERC20ABI,
  PoolPortalABI,
  PoolPortal
} from '../../../../config.js'

import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import setPending from '../../../../utils/setPending'
import { toWei } from 'web3-utils'

class SellPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      amount:0,
      bntAmountFromWei:0,
      ercAmountFromWei:0,
      ercSymbol:'',
      bntSymbol:''
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.fromAddress !== this.props.fromAddress || prevState.amount !== this.state.amount){
      this.updateSellInfo()
    }
  }

  updateSellInfo = async () => {
    if(this.props.fromAddress && this.state.amount > 0){
      const web3 = this.props.web3
      // get current reserve amount for pool
      const poolPortal = new web3.eth.Contract(PoolPortalABI, PoolPortal)

      // get addresses
      const { BNTConnector, ERCConnector } = await poolPortal.methods.getBancorConnectorsByRelay(
        this.props.fromAddress
      ).call()

      // get amount
      const { bancorAmount, connectorAmount } = await poolPortal.methods.getBancorConnectorsAmountByRelayAmount(
        toWei(String(this.state.amount)),
        this.props.fromAddress
      ).call()

      const bntToken = new web3.eth.Contract(ERC20ABI, BNTConnector)
      const ercToken = new web3.eth.Contract(ERC20ABI, ERCConnector)

      const ercDecimals = await ercToken.methods.decimals().call()

      // try catch for bytes32 return case
      let ercSymbol
      try{
        ercSymbol = await ercToken.methods.symbol().call()
      }catch(e){
        ercSymbol = "ERC"
      }

      const bntSymbol = await bntToken.methods.symbol().call()

      const bntAmountFromWei = fromWeiByDecimalsInput(18, bancorAmount)
      const ercAmountFromWei = fromWeiByDecimalsInput(ercDecimals, connectorAmount)

      this.setState({ bntAmountFromWei, ercAmountFromWei, ercSymbol, bntSymbol })
    }else{
      this.setState({
        bntAmountFromWei:0,
        ercAmountFromWei:0,
        ercSymbol:'',
        bntSymbol:''
      })
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
      <br/>
      <br/>
      {
        this.state.bntAmountFromWei !== 0 && this.state.ercAmountFromWei !== 0
        ?
        (
          <Alert variant="success">
          You will receive
          &nbsp;
          {this.state.bntSymbol}&nbsp;:&nbsp;{this.state.bntAmountFromWei}
          &nbsp;&nbsp;
          {this.state.ercSymbol}&nbsp;:&nbsp;{this.state.ercAmountFromWei}
          </Alert>
        ):null
      }
      </React.Fragment>
    )
  }

}

export default SellPool

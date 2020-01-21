import React, { Component } from 'react'
import { Button, Form, Alert } from "react-bootstrap"
import { Typeahead } from 'react-bootstrap-typeahead'
import {
  SmartFundABIV3,
  PoolPortalABI,
  PoolPortal,
  ERC20ABI
} from '../../../config.js'
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../../utils/weiByDecimals'
import { isAddress } from 'web3-utils'

class SwapPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      fromAddress:'',
      toAddress:'',
      isToERC20:false,
      isFromERC20:false,
      amount:0,
      recieve:0,
      reciveFromWei:0,
      symbolTo: ''
    }
  }

  // update rate by onChange
  componentDidUpdate(prevProps, prevState){
    if(prevState.toAddress !== this.state.toAddress
      ||
      prevState.fromAddress !== this.state.fromAddress
      ||
      prevState.amount !== this.state.amount
    )
    {
      if(this.state.amount > 0 && isAddress(this.state.fromAddress) && isAddress(this.state.toAddress))
      this.setRate()
    }
  }

  // get ration between fron and to
  setRate = async () => {
    const web3 = this.props.web3
    const poolPortal = new web3.eth.Contract(PoolPortalABI, PoolPortal)

    // Get amount in wei by decimals for send
    const fromTokenInfo = await this.getTokenInfo(this.state.fromAddress)
    const decimalsFrom = fromTokenInfo.decimals
    const amountInWei = toWeiByDecimalsInput(decimalsFrom, this.state.amount)

    // get rate
    const recive = await poolPortal.methods.getRatio(
    this.state.fromAddress,
    this.state.toAddress,
    amountInWei
    ).call()

    // Convert recieve in wei
    const toTokenInfo = await this.getTokenInfo(this.state.toAddress)
    const decimalsTo = toTokenInfo.decimals
    const reciveFromWei = Number(fromWeiByDecimalsInput(decimalsTo, recive))

    const symbolTo = toTokenInfo.symbol

    this.setState({ recive, reciveFromWei, symbolTo })
  }

  checkFundBalance = async () => {
    
  }

  // execude swap
  swap = () => {

  }

  // get decimal and symbol by token address
  getTokenInfo = async (tokenAddress) => {
    const web3 = this.props.web3
    const token = new web3.eth.Contract(ERC20ABI, tokenAddress)
    const decimals = await token.methods.decimals().call()

    let symbol
    try{
      symbol = await token.methods.symbol().call()
    }catch(e){
      symbol = "Token"
    }

    return { decimals, symbol }
  }


  render() {
    return (
      <React.Fragment>

      <Form.Group>
      <Form.Check
      type="checkbox"
      label="hide relays, show tokens"
      onChange={() => this.setState({ isFromERC20 : !this.state.isFromERC20 })}/>
      </Form.Group>

      <Typeahead
        labelKey="smartTokenSymbols"
        multiple={false}
        id="smartTokenSymbols"
        options={ this.state.isFromERC20 ? this.props.symbols : this.props.smartTokenSymbols }
        onChange={(s) => this.setState(
          {fromAddress: this.props.findAddressBySymbol(s[0], this.state.isFromERC20)}
        )}
        placeholder="Choose a symbol for send"
      />
      <br/>

      <Form.Group>
      <Form.Check
      type="checkbox"
      label="hide relays, show tokens"
      onChange={() => this.setState({ isToERC20 : !this.state.isToERC20 })} />
      </Form.Group>

      <Typeahead
        labelKey="smartTokenSymbols"
        multiple={false}
        id="smartTokenSymbols"
        options={ this.state.isToERC20 ? this.props.symbols : this.props.smartTokenSymbols}
        onChange={(s) => this.setState(
          {toAddress: this.props.findAddressBySymbol(s[0], this.state.isToERC20)}
        )}
        placeholder="Choose a symbol for recieve"
      />
      <br/>
      <Form.Control
      placeholder="Enter amount for send"
      name="amount"
      onChange={(e) => this.setState({ amount: e.target.value })}
      type="number" min="1"/>
      <br/>
      {
        this.state.reciveFromWei > 0
        ?
        (
          <Alert variant="success">You will recive : {this.state.reciveFromWei} {this.state.symbolTo}</Alert>
        )
        :null
      }
      <br/>
      <Button variant="outline-primary" onClick={() => this.swap()}>Swap</Button>
      </React.Fragment>
    )
  }

}

export default SwapPool

import React, { Component } from 'react'
import { Button, Form, Alert } from "react-bootstrap"
import { Typeahead } from 'react-bootstrap-typeahead'
import {
  SmartFundABIV3,
  PoolPortalABI,
  PoolPortal,
  ERC20ABI,
  BNTEther
} from '../../../config.js'
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../../utils/weiByDecimals'
import { isAddress } from 'web3-utils'
import setPending from '../../../utils/setPending'


// Fund recognize ETH by this address
export const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

class SwapPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      fromAddress:'',
      toAddress:'',
      isToERC20:false,
      isFromERC20:false,
      amount:0,
      amountInWei:0,
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

    this.setState({ amountInWei, recive, reciveFromWei, symbolTo })
  }

  // check smart fund balance
  // return true if enough balance
  checkFundBalance = async () => {
    const web3 = this.props.web3
    const token = new web3.eth.Contract(ERC20ABI, this.state.fromAddress)
    let balanceFromWei
    if(this.state.fromAddress === BNTEther){
      const balance = web3.eth.getBalance(this.props.smartFundAddress)
      balanceFromWei = fromWeiByDecimalsInput(18, balance)
    }else{
      const decimals = await token.methods.decimals().call()
      const balance = await token.methods.balanceOf(this.props.smartFundAddress).call()
      balanceFromWei = fromWeiByDecimalsInput(decimals, balance)
    }
    const status = balanceFromWei >= this.state.amount ? true : false
    return status
  }

  // execude swap
  swap = async () => {
    const isEnoughBalance = await this.checkFundBalance()
    if(isEnoughBalance){
      const web3 = this.props.web3
      const fund = new web3.eth.Contract(SmartFundABIV3, this.props.smartFundAddress)
      const block = await web3.eth.getBlockNumber()

      // wrap ETH case
      const from = this.state.fromAddress === BNTEther ? ETH : this.state.fromAddress
      const to = this.state.toAddress === BNTEther ? ETH : this.state.toAddress

      // trade
      fund.methods.trade(
        from,
        this.state.amountInWei,
        to,
        1, // via Bancor portal
        [],
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ).send({ from: this.props.accounts[0]})
      .on('transactionHash', (hash) => {
      // pending status for spiner
      this.props.pending(true)
      // pending status for DB
      setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
      })

      // close pool modal
      this.props.modalClose()
    }
    else{
      alert('Smart fund do not have enough balance')
    }
  }

  // get decimal and symbol by token address
  getTokenInfo = async (tokenAddress) => {
    let decimals
    let symbol

    if(tokenAddress === BNTEther){
      decimals = 18
      symbol = 'ETH'
    }
    else{
      const web3 = this.props.web3
      const token = new web3.eth.Contract(ERC20ABI, tokenAddress)
      decimals = await token.methods.decimals().call()
      try{
        symbol = await token.methods.symbol().call()
      }catch(e){
        symbol = "Token"
      }
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

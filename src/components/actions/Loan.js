import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
import { NeworkID, ERC20ABI, SmartFundABIV5 } from '../../config.js'
//import axios from 'axios'
import { Typeahead } from 'react-bootstrap-typeahead'
import setPending from '../../utils/setPending'
import { toWeiByDecimalsInput } from '../../utils/weiByDecimals'
import { toWei } from 'web3-utils'

class PoolModal extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      symbols: [],
      tokens:[],
      cTokenAddress:'',
      action:'Loan',
      amount:0,
      percent:0
    }
  }

  _isMounted = false
  componentDidMount(){
    this._isMounted = true
    this.initData()

  }

  componentWillUnmount(){
    this._isMounted = false
  }

  initData = async () => {
    if(NeworkID === 3){
      const symbols = ['cDAI', 'cETH']
      const tokens =  [
        {symbol:'cDAI', address:'0x6ce27497a64fffb5517aa4aee908b1e7eb63b9ff'},
        {symbol:'cETH', address:'0x1d70b01a2c3e3b2e56fcdcefe50d5c5d70109a5d'}]

      this.setState({ symbols, tokens })
    }else{
      alert('TODO: load data from compound api')
    }
  }

  findAddressBySymbol = (symbol) => {
    const tokenObj = this.state.tokens.find((item) => item.symbol && item.symbol === symbol)
    if(tokenObj){
      return tokenObj.address
    }else{
      return null
    }
  }

  getTokenWeiByDecimals = async () => {
    if(this.state.cTokenAddress === this.findAddressBySymbol('cETH')){
      return toWei(String(this.state.amount))
    }else{
      const token = new this.props.web3.eth.Contract(ERC20ABI, this.state.cTokenAddress)
      const decimals = await token.methods.decimals.call()
      return toWeiByDecimalsInput(decimals, String(this.state.amount))
    }
  }

  compoundMint = async () => {
    if(this.state.amount > 0 && this.state.cTokenAddress){
      const fund = new this.props.web3.eth.Contract(SmartFundABIV5, this.props.smartFundAddress)
      const block = await this.props.web3.eth.getBlockNumber()
      const weiInput = await this.getTokenWeiByDecimals()
      console.log("weiInput",weiInput)
      // Mint
      fund.methods.compoundMint(weiInput, this.state.cTokenAddress)
      .send({ from:this.props.accounts[0] })
      .on('transactionHash', (hash) => {
      // pending status for spiner
      this.props.pending(true)
      // pending status for DB
      setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
      })
      // close pool modal
      this.modalClose()
    }else{
      alert('Please fill all fields')
    }
  }

  compoundRedeem = async () => {
    if(this.state.percent > 0 && this.state.percent <= 100 && this.state.cTokenAddress){
      const fund = new this.props.web3.eth.Contract(SmartFundABIV5, this.props.smartFundAddress)
      const block = await this.props.web3.eth.getBlockNumber()
      // Mint
      fund.methods.compoundRedeemByPercent(this.state.percent, this.state.cTokenAddress)
      .send({ from:this.props.accounts[0] })
      .on('transactionHash', (hash) => {
      // pending status for spiner
      this.props.pending(true)
      // pending status for DB
      setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
      })
      // close pool modal
      this.modalClose()
    }else{
      alert('Please fill all fields correct')
    }
  }


  renderAction(){
    if(this.state.action === "Loan"){
      return(
        <React.Fragment>
        <Form.Control
        type="number"
        min="0"
        placeholder="Enter amount to lend"
        name="amount"
        onChange={(e) => this.setState({ amount:e.target.value })}
        />
        <br/>
        <Button
        variant="outline-primary"
        type="button"
        onClick={() => this.compoundMint()}
        >
        Loan
        </Button>
        </React.Fragment>
      )
    }
    else if (this.state.action === "Redeem") {
      return(
        <React.Fragment>
        <Form.Control
        type="number"
        min="0"
        placeholder="Enter percent for withdraw"
        name="amount"
        onChange={(e) => this.setState({ percent:e.target.value })}
        />
        <br/>
        <Button
        variant="outline-primary"
        type="button"
        onClick={() => this.compoundRedeem()}
        >
        Redeem
        </Button>
        </React.Fragment>
      )
    }
    else{
      return null
    }
  }

  modalClose = () => this.setState({ Show: false })
  render() {
    return (
      <React.Fragment>
      <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
        Loan
      </Button>

      <Modal
        show={this.state.Show}
        onHide={() => this.modalClose()}
      >
        <Modal.Header closeButton>
        <Modal.Title>
        Loan
        </Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form>
        <Form.Group controlId="exampleForm.ControlSelect1">
        <Form.Label>Select Compound action</Form.Label>
        <Form.Control
         as="select"
         size="sm"
         onChange={(e) => this.setState({ action:e.target.value })}
         >
          <option>Loan</option>
          <option>Redeem</option>
        </Form.Control>
        </Form.Group>

        <Typeahead
          labelKey="compoundSymbols"
          multiple={false}
          id="compoundSymbols"
          options={this.state.symbols}
          onChange={(s) => this.setState({cTokenAddress: this.findAddressBySymbol(s[0])})}
          placeholder="Choose a symbol"
        />
        <br/>

        <Form.Group>
        {
          this.renderAction()
        }
        </Form.Group>
        </Form>
        </Modal.Body>
      </Modal>

      </React.Fragment>
    )
  }
}

export default PoolModal

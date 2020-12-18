import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
import { NeworkID, ERC20ABI, SmartFundABIV7, YTokenABI } from '../../config.js'
import checkTokensLimit from '../../utils/checkTokensLimit'
import { Typeahead } from 'react-bootstrap-typeahead'
import setPending from '../../utils/setPending'

import {
  toWeiByDecimalsInput,
  // fromWeiByDecimalsInput
} from '../../utils/weiByDecimals'

import {
  // toWei,
  fromWei
} from 'web3-utils'

import SetGasPrice from '../settings/SetGasPrice'
import { numStringToBytes32 } from '../../utils/numberToFromBytes32'

class YearnLoan extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      symbols: [],
      tokens:[],
      yTokenAddress:'',
      action:'Loan',
      amount:0,
      percent:50
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
    let symbols = []
    let tokens = []

    if(NeworkID === 1){
      symbols = ['yDAIv3']
      tokens =  [
        {symbol:'yDAIv3', address:'0xc2cb1040220768554cf699b0d863a3cd4324ce32'}
      ]
    }
    else{
      alert('There are no yearn tokens for test network')
    }

    this.setState({ symbols, tokens })
  }

  findAddressBySymbol = (symbol) => {
    const tokenObj = this.state.tokens.find((item) => item.symbol && item.symbol === symbol)
    if(tokenObj){
      return tokenObj.address
    }else{
      return null
    }
  }


  YearnDeposit = async () => {
    if(this.state.amount > 0 && this.state.yTokenAddress){
      const yToken = this.props.web3.eth.Contract(YTokenABI, this.state.yTokenAddress)
      const tokenAddress = await yToken.methods.token().call()
      const token = this.props.web3.eth.Contract(ERC20ABI, tokenAddress)
      const tokenDecimals = await token.methods.decimals().call()

      const tokenBalanceInFund = await token.methods.balanceOf(this.props.smartFundAddress).call()
      const tokenAmountToDeposit = toWeiByDecimalsInput(tokenDecimals, this.state.amount)

      if(parseFloat(fromWei(String(tokenBalanceInFund))) >= parseFloat(fromWei(String(tokenAmountToDeposit)))){
        try{
          const fund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)
          const block = await this.props.web3.eth.getBlockNumber()

          // get gas price from local storage
          const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

          // this function will throw execution with alert warning if there are limit
          await checkTokensLimit(this.state.yTokenAddress, fund)

          // deposit
          fund.methods.callDefiPortal(
            [tokenAddress],
            [tokenAmountToDeposit],
            [numStringToBytes32(String(0))],
            this.props.web3.eth.abi.encodeParameters(
              ['address', 'uint256'],
              [this.state.yTokenAddress, 1]
            )
          )
          .send({ from:this.props.accounts[0], gasPrice })
          .on('transactionHash', (hash) => {
          // pending status for spiner
          this.props.pending(true)
          // pending status for DB
          setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
          })
          // close pool modal
          this.modalClose()
        }
        catch(e){
          console.log(e)
          alert('Can not verify transaction data, please try again in a minute')
        }
      }
      else{
        alert('Your fund not have enough balance')
      }
    }else{
      alert('Please fill all fields')
    }
  }

  YearnRedeem = async () => {
    if(this.state.percent > 0 && this.state.percent <= 100 && this.state.yTokenAddress){
      const cToken = new this.props.web3.eth.Contract(ERC20ABI, this.state.yTokenAddress)
      const balance = await cToken.methods.balanceOf(this.props.smartFundAddress).call()

      // get gas price from local storage
      const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

      // allow reedem only if there are some amount of current cToken
      if(parseFloat(balance) > 0){
        const fund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)
        const block = await this.props.web3.eth.getBlockNumber()
        // Mint
        fund.methods.YearnRedeemByPercent(this.state.percent, this.state.yTokenAddress)
        .send({ from:this.props.accounts[0], gasPrice })
        .on('transactionHash', (hash) => {
        // pending status for spiner
        this.props.pending(true)
        // pending status for DB
        setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
        })
        // close pool modal
        this.modalClose()
      }else{
        alert("Nothing to reedem")
      }
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
        onClick={() => this.YearnDeposit()}
        >
        Loan
        </Button>
        </React.Fragment>
      )
    }
    else if (this.state.action === "Redeem") {
      return(
        <React.Fragment>
        <Form.Label>Reedem percent {this.state.percent} %</Form.Label>
        <Form.Control
        type="range"
        min="1"
        max="100"
        placeholder="Enter percent for withdraw"
        onChange={(e) => this.setState({ percent:e.target.value })}
        />
        <br/>
        <Button
        variant="outline-primary"
        type="button"
        onClick={() => this.YearnRedeem()}
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

  modalClose = () => this.setState({ Show: false, action:'Loan', percent:50 })
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
          onChange={(s) => this.setState({yTokenAddress: this.findAddressBySymbol(s[0])})}
          placeholder="Choose a symbol"
        />
        <br/>

        <Form.Group>
        {
          this.renderAction()
        }
        </Form.Group>

        {/* Update gas price */}
        <br />
        {
          this.props.web3 ? <SetGasPrice web3={this.props.web3}/> : null
        }
        </Form>
        </Modal.Body>
      </Modal>

      </React.Fragment>
    )
  }
}

export default YearnLoan

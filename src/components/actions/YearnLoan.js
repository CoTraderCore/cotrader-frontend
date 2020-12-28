import React, { Component } from 'react'
import { Button, Modal, Form, Alert } from "react-bootstrap"
import { NeworkID, ERC20ABI, SmartFundABIV7, YTokenABI } from '../../config.js'
import checkTokensLimit from '../../utils/checkTokensLimit'
import { Typeahead } from 'react-bootstrap-typeahead'
import setPending from '../../utils/setPending'
import BigNumber from 'bignumber.js'

import {
  toWeiByDecimalsInput,
  fromWeiByDecimalsInput
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
      ySymbols:[],
      tokens:[],
      yTokenAddress:'',
      action:'Loan',
      amount:0,
      percent:50,
      amountOfReceive:0,
      symbolOfReceive: ''
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

  componentDidUpdate = async (prevProps, prevState) => {
    if(prevState.yTokenAddress !== this.state.yTokenAddress
      || prevState.amount !== this.state.amount
    )
    {
      let amountOfReceive = 0
      let symbolOfReceive = ''

      if(this.state.amount > 0 && this.state.yTokenAddress){
        if(this.state.action === 'Loan'){
          ({ amountOfReceive,
             symbolOfReceive } = await this.calculatePoolShareByTokenValue(this.state.amount))
        }else{
          ({ amountOfReceive,
             symbolOfReceive } = await this.calculateTokenValueByPoolShare(this.state.amount))
        }

        this.setState({ amountOfReceive, symbolOfReceive })
      }
    }
  }

  initData = async () => {
    let symbols = []
    let ySymbols = []
    let tokens = []

    if(NeworkID === 1){
      symbols = ['DAI', 'USDT', 'USDC']
      ySymbols = ['yDAIv3', 'yUSDTv3', 'yUSDCv3']
      tokens =  [
        {symbol:'DAI', ySymbol:'yDAIv3', address:'0xc2cb1040220768554cf699b0d863a3cd4324ce32'},
        {symbol:'USDT', ySymbol:'yUSDTv3', address:'0xe6354ed5bc4b393a5aad09f21c46e101e692d447'},
        {symbol:'USDC', ySymbol:'yUSDCv3', address:'0x26EA744E5B887E5205727f55dFBE8685e3b21951'}
      ]
    }
    else{
      alert('There are no yearn tokens for test network')
    }

    this.setState({ symbols, ySymbols, tokens })
  }

  findAddressBySymbol = (symbol) => {
    const prop = this.state.action === 'Loan' ? 'symbol' : 'ySymbol'

    const tokenObj = this.state.tokens.find((item) => item[prop] && item[prop] === symbol)
    if(tokenObj){
      return tokenObj.address
    }else{
      return null
    }
  }

  calculateTokenValueByPoolShare = async (poolShare) => {
    const yToken = this.props.web3.eth.Contract(YTokenABI, this.state.yTokenAddress)
    const pool = await yToken.methods.calcPoolValueInToken().call()
    const totalSupply = await yToken.methods.totalSupply().call()
    const tokenAddress = await yToken.methods.token().call()
    const token = this.props.web3.eth.Contract(ERC20ABI, tokenAddress)

    const decimals = await yToken.methods.decimals().call()
    const poolShareToWei = toWeiByDecimalsInput(decimals, poolShare)
    const result = BigNumber(pool).multipliedBy(poolShareToWei).dividedBy(totalSupply)
    const symbolOfReceive = await token.methods.symbol().call()

    return { amountOfReceive:fromWeiByDecimalsInput(decimals, result),  symbolOfReceive}
  }

  calculatePoolShareByTokenValue = async (tokenAmount) => {
    const yToken = this.props.web3.eth.Contract(YTokenABI, this.state.yTokenAddress)
    const pool = await yToken.methods.calcPoolValueInToken().call()
    const totalSupply = await yToken.methods.totalSupply().call()
    const tokenAddress = await yToken.methods.token().call()
    const token = this.props.web3.eth.Contract(ERC20ABI, tokenAddress)

    const decimals = await token.methods.decimals().call()
    const tokenAmountInWei = toWeiByDecimalsInput(decimals, tokenAmount)
    const result = BigNumber(tokenAmountInWei).multipliedBy(totalSupply).dividedBy(pool)
    const symbolOfReceive = await yToken.methods.symbol().call()

    return { amountOfReceive:fromWeiByDecimalsInput(decimals, result),  symbolOfReceive }
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
        alert('Influence balance')
      }
    }else{
      alert('Please fill all fields')
    }
  }

  YearnWithdraw = async () => {
    if(this.state.amount > 0 && this.state.yTokenAddress){
      const yToken = this.props.web3.eth.Contract(YTokenABI, this.state.yTokenAddress)
      const yDecimals = await yToken.methods.decimals().call()
      const sharesInFund = await yToken.methods.balanceOf(this.props.smartFundAddress).call()
      const sharesToWithdrawInWei = toWeiByDecimalsInput(yDecimals, this.state.amount)

      // get gas price from local storage
      const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

      // allow reedem only if there are some amount of current cToken
      if(parseFloat(fromWei(String(sharesInFund))) >= this.state.amount){
        const fund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)
        const block = await this.props.web3.eth.getBlockNumber()

        // withdraw
        fund.methods.callDefiPortal(
          [this.state.yTokenAddress],
          [sharesToWithdrawInWei],
          [numStringToBytes32(String(1))],
          this.props.web3.eth.abi.encodeParameters(
            ['uint256'],
            [1]
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
      }else{
        alert("Influence balance")
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
        <Form.Control
        type="number"
        min="0"
        placeholder="Enter amount to withdraw"
        name="amount"
        onChange={(e) => this.setState({ amount:e.target.value })}
        />
        <br/>
        <Button
        variant="outline-primary"
        type="button"
        onClick={() => this.YearnWithdraw()}
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

  modalClose = () => this.setState({
    Show: false,
    symbols: [],
    ySymbols: [],
    tokens: [],
    yTokenAddress:'',
    action:'Loan',
    amount:0,
    percent:50,
    amountOfReceive:0,
    symbolOfReceive: ''
  })

  render() {
    return (
      <React.Fragment>
      <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
        Yearn 
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
        <strong><Alert variant="warning">Attention, this functionality is under testing</Alert></strong>
        <Form.Group controlId="exampleForm.ControlSelect1">
        <Form.Label>Select Yearn finance action</Form.Label>
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
          labelKey="ySymbols"
          multiple={false}
          id="ySymbols"
          options={ this.state.action === 'Loan' ? this.state.symbols : this.state.ySymbols}
          onChange={(s) => this.setState({yTokenAddress: this.findAddressBySymbol(s[0])})}
          placeholder="Choose a symbol"
          renderMenuItemChildren={(options, props) => (
            <div>
              <img
              style={{height: "35px", width: "35px"}}
              src={`https://tokens.1inch.exchange/${this.findAddressBySymbol(options)}.png`}
              alt="Logo"
              onError={(e)=>{e.target.onerror = null; e.target.src="https://etherscan.io/images/main/empty-token.png"}}/>
              &nbsp; &nbsp;
              {options}
            </div>
          )}
        />
        <br/>
        <Form.Group>
        {
          this.renderAction()
        }
        <br/>
        <br/>
        {
          this.state.amountOfReceive > 0
          ?
          (
            <Alert variant="success">You will receive : {parseFloat(this.state.amountOfReceive).toFixed(6)} of {this.state.symbolOfReceive}</Alert>
          )
          :null
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

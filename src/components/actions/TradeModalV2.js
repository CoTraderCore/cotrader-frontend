// Modal for trade via Paraswap (Paraswap get best rate from Kyber, Bancor, Uniswap ect)
import React, { Component } from 'react'
import {
  SmartFundABIV2,
  ParaswapApi,
  NeworkID,
  IParaswapPriceFeedABI,
  ParaswapPriceFeedAddress,
  ParaswapParamsABI,
  ParaswapParamsAddress,
  ERC20ABI
} from '../../config.js'

import {
  Button,
  Modal,
  Form,
  Alert,
  Dropdown,
  InputGroup
} from "react-bootstrap"

import setPending from '../../utils/setPending'
import axios from 'axios'
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../utils/weiByDecimals'

import { coinPics } from '../../tokens/tokensHelpers'


class TradeModalV2 extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      ShowModal: false,
      Send: 'ETH',
      Recive:'ETH',
      AmountSend:0,
      AmountRecive:0,
      AlertError:false,
      tokens: null,
      symbols: null,
      sendFrom: '',
      sendTo:'',
      decimalsFrom:18
    }
  }

  _isMounted = false;
  componentDidMount(){
    this._isMounted = true
    this.initData()

  }

  componentWillUnmount(){
    this._isMounted = false
  }

  // get tokens addresses and symbols from paraswap api
  initData = async () => {
    try{
      let tokens = await axios.get(ParaswapApi + '/tokens')
      tokens = tokens.data.tokens
      let symbols = []
      for(let i = 0; i< tokens.length; i++){
        symbols.push(tokens[i].symbol)
      }
      if(this._isMounted){
        this.setState({ tokens, symbols })
        if(NeworkID !== 1 && NeworkID !== 42){
          alert("WARNING v2 avilable only for Mainnet and Kovan")
        }
      }
    }catch(e){
      alert("Can not get data from api, please try again latter")
      console.log(e)
    }
  }

  errorShow = (bool) => {
    this.setState({ AlertError:bool })
  }


  // Check if fund has assets for certain token
  // return true if fund has enougth balance
  checkFundBalance = async () => {
    let fundBalance
    let result = false

    if(this.state.sendFrom === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'){
      fundBalance = await this.props.web3.eth.getBalance(this.props.smartFundAddress)
      fundBalance = this.props.web3.utils.fromWei(fundBalance)
    }
    else{
      const ERC20 = new this.props.web3.eth.Contract(ERC20ABI, this.state.sendFrom)
      fundBalance = await ERC20.methods.balanceOf(this.props.smartFundAddress).call()
      fundBalance = fromWeiByDecimalsInput(this.state.decimalsFrom, this.props.web3.utils.hexToNumberString(fundBalance._hex))
    }

    if(fundBalance >= this.state.AmountSend)
      result = true

    return result
  }


  // helper for update state by onchange
  change = e => {
    // Update rate in correct direction order and set state
    if(e.target.name === "AmountSend"){
      const { sendFrom, sendTo, decimalsFrom, decimalsTo } = this.getDirectionInfo()
      this.setRate(sendFrom, sendTo, e.target.value, "AmountRecive", decimalsFrom, decimalsTo)
      this.setState({
        [e.target.name]: e.target.value,
        sendFrom,
        sendTo,
        decimalsFrom
      })
    }
    // Update rate in reverse order direction and set state
    else if(e.target.name === "AmountRecive"){
      const { sendFrom, sendTo, decimalsFrom, decimalsTo } = this.getDirectionInfo()
      this.setRate(sendTo, sendFrom, e.target.value, "AmountSend", decimalsTo, decimalsFrom)
      this.setState({
        [e.target.name]: e.target.value,
        sendFrom,
        sendTo,
        decimalsFrom
      })
    }
    // Just set state by input
    else{
      this.setState({
      [e.target.name]: e.target.value
      })
    }
  }


  // helper for update state by click
  changeByClick = (name, param) => {
    this.setState({
      [name]:param,
      AmountSend:0,
      AmountRecive:0
    })
  }


  // found addresses and decimals by direction symbols
  getDirectionInfo = () => {
    const From = this.state.tokens.filter(item => item.symbol === this.state.Send)
    const decimalsFrom = From[0].decimals
    const sendFrom = From[0].addresses[NeworkID]

    const To = this.state.tokens.filter(item => item.symbol === this.state.Recive)
    const decimalsTo = To[0].decimals
    const sendTo = To[0].addresses[NeworkID]

    return { sendFrom, sendTo, decimalsFrom, decimalsTo }
  }

  // helper for convert additional data in bytes32
  packDataToBytes32Array = async (
    minDestinationAmount,
    callees,
    startIndexes,
    values,
    mintPrice
  ) => {
    const paramsContract = new this.props.web3.eth.Contract(ParaswapParamsABI, ParaswapParamsAddress)
    const bytes32 = await paramsContract.methods.convertParaswapParamsToBytes32Array(
      minDestinationAmount,
      callees,
      startIndexes,
      values,
      mintPrice
    ).call()

    return bytes32
  }

  // Get data from paraswap api and convert some data for bytes32 array
  getTradeData = async () => {
    const sendInWei = toWeiByDecimalsInput(this.state.decimalsFrom, this.state.AmountSend)
    // STEP 1 get tx data
    const transactionsData = await axios.get(
      `${ParaswapApi}/v1/transactions/${NeworkID}/${this.state.sendFrom}/${this.state.sendTo}/${sendInWei}`
    )

    // STEP 2 get best exchange from tx data
    const txConfig  = {
      'priceRoute': {
      'bestRoute': transactionsData.data.priceRoute.bestRoute,
      'amount':transactionsData.data.priceRoute.amount
      },
      'srcToken': this.state.sendFrom,
      'destToken': this.state.sendTo,
      'srcAmount': sendInWei,
      'destAmount': transactionsData.data.priceRoute.amount,
      'userAddress': this.props.accounts[0],
      'payTo': ''
    }

    const aggregatedData = await axios.post(
      `${ParaswapApi}/transactions/${NeworkID}?getParams=true`, txConfig
    )

    // STEP 3 convert addition data to bytes32
    const bytes32Array = await this.packDataToBytes32Array(
      aggregatedData.data.minDestinationAmount,
      aggregatedData.data.callees,
      aggregatedData.data.startIndexes,
      aggregatedData.data.values,
      aggregatedData.data.mintPrice
    )

    // STEP 4 return data
    return {
      _sourceToken: aggregatedData.data.sourceToken,
      _sourceAmount: aggregatedData.data.sourceAmount,
      _destinationToken: aggregatedData.data.destinationToken,
      _type: 0,
      _additionalArgs: bytes32Array,
      _additionalData: aggregatedData.data.exchangeData
     }
  }

  // trade from smart fund
  trade = async () => {
    const {
    _sourceToken,
    _sourceAmount,
    _destinationToken,
    _type,
    _additionalArgs,
    _additionalData
  } = await this.getTradeData()

   console.log(
     _sourceToken,
     _sourceAmount,
     _destinationToken,
     _type,
     _additionalArgs,
     _additionalData
   )

   const smartFund = new this.props.web3.eth.Contract(SmartFundABIV2, this.props.smartFundAddress)
   const block = await this.props.web3.eth.getBlockNumber()

   this.setState({ ShowModal: false })

    smartFund.methods.trade(
      _sourceToken,
      _sourceAmount,
      _destinationToken,
      _type,
      _additionalArgs,
      _additionalData
    )
    .send({ from: this.props.accounts[0] })
    .on('transactionHash', (hash) => {
    console.log(hash)
    // pending status for spiner
    this.props.pending(true)
    // pending status for DB
    setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
    })
  }



  /** dev get rate (can calculate by input to or from)
  * params
  * address from and to,
  * input tokens amount
  * type (direction Send or Recieve),
  * decimals token decimals
  */
  setRate = async (from, to, amount, type, decimalsFrom, decimalsTo) => {
    if(amount > 0 && from !== to){
    const contract = new this.props.web3.eth.Contract(IParaswapPriceFeedABI, ParaswapPriceFeedAddress)
    const src = toWeiByDecimalsInput(decimalsFrom, amount.toString())

    let value = await contract.methods.getBestPrice(from, to, src).call()
    value = value.rate
    if(value){
      const result = fromWeiByDecimalsInput(decimalsTo, this.props.web3.utils.hexToNumberString(value._hex))
      this.setState({ [type]: result})
    }else{
      this.setState({ [type]: 0})
    }
   }
  }

  // Validation input and smart fund balance
  validation = async () => {
    if(this.state.AmountSend > 0){
      const status = await this.checkFundBalance()
      if(status){
        this.trade()
      }else{
        this.errorShow(true)
      }
    }else{
      alert('Please input amount')
    }
  }


  render() {
   let CloseModal = () => this.setState({
     ShowModal: false,
     Send: 'ETH',
     Recive:'ETH',
     AmountSend:0,
     AmountRecive:0
   })

   return (
      <div>
        <Button variant="outline-primary" onClick={() => this.setState({ ShowModal: true })}>
          Exchange
        </Button>

          <Modal
          size="lg"
          show={this.state.ShowModal}
          onHide={CloseModal}
          aria-labelledby="example-modal-sizes-title-lg"
          >
          <Modal.Header closeButton>
            <Modal.Title id="example-modal-sizes-title-lg">
              Exchange
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          {
          this.state.tokens
          ?
          (
          <Form>
          <Form.Label>Send: {this.state.Send}</Form.Label>
          <InputGroup className="mb-3">
          <InputGroup.Prepend>
          <Dropdown>
          <Dropdown.Toggle variant="outline-primary">
          Select token
          </Dropdown.Toggle>
          <Dropdown.Menu style={{"height":"290px", "overflowY":"scroll"}}>
          {this.state.symbols.map((symbol) => {
          return <Dropdown.Item onClick={() => this.changeByClick("Send", symbol)} key={symbol}><img src={coinPics(symbol)} alt={symbol} width="19" height="15"/> {symbol}</Dropdown.Item>
          })}
          </Dropdown.Menu>
          </Dropdown>
          </InputGroup.Prepend>
          <Form.Control
          type="number"
          placeholder={this.state.AmountSend}
          min="0"
          name="AmountSend"
          value={this.state.AmountSend}
          onChange={e => this.change(e)}
          />
          </InputGroup>

           {
            this.state.AlertError ?(
            <Alert variant="danger">
            {
              `ERROR: Not enought ${this.state.Send} in this SmartFund`
            }
            </Alert>)
            :(null)
            }

          <Form.Label>Recive: {this.state.Recive}</Form.Label>
          <InputGroup className="mb-3">
          <InputGroup.Prepend>
          <Dropdown>
          <Dropdown.Toggle variant="outline-primary" id="dropdown-basic">
          Select token
          </Dropdown.Toggle>
          <Dropdown.Menu style={{"height":"250px", "overflowY":"scroll"}}>
          {this.state.symbols.map((symbol) => {
          return <Dropdown.Item onClick={() => this.changeByClick("Recive", symbol)} key={symbol}><img src={coinPics(symbol)} alt={symbol} width="19" height="15"/> {symbol}</Dropdown.Item>
          })}
          </Dropdown.Menu>
          </Dropdown>
          </InputGroup.Prepend>
          <Form.Control
          type="number"
          placeholder={this.state.AmountRecive}
          min="0"
          name="AmountRecive"
          value={this.state.AmountRecive}
          onChange={e => this.change(e)}
          />
          </InputGroup>
          <br />
          <Button variant="outline-primary" onClick={() => this.validation()}>Execute trade</Button>
           </Form>
          )
          :
          (<p>Load data...</p>)
          }
          </Modal.Body>
        </Modal>
        </div>
    )
  }
}

export default TradeModalV2

// this trade modal work only with 1 INCH PROTO (fully onchain) and 1 INCH ETH (calldata from api)
// with lovest price
// also this modal work with merkle tree tokens white list verification
// support only for versions >= 7

import React, { Component } from 'react'
import {
  SmartFundABIV7,
  OneInchApi,
  NeworkID,
  ERC20ABI,
  APIEnpoint,
  ExchangePortalAddressV6,
  ExchangePortalABIV6,
  OneInchProto,
  OneInchABI
} from '../../config.js'

import {
  Button,
  Modal,
  Form,
  Alert,
  InputGroup,
  Tooltip,
  OverlayTrigger,
  Badge
} from "react-bootstrap"

import SetGasPrice from '../settings/SetGasPrice'
import setPending from '../../utils/setPending'
import getMerkleTreeData from '../../utils/getMerkleTreeData'
import axios from 'axios'
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../utils/weiByDecimals'
import checkTokensLimit from '../../utils/checkTokensLimit'
import Pending from '../templates/Spiners/Pending'
import BigNumber from 'bignumber.js'
import { Typeahead } from 'react-bootstrap-typeahead'
import { ropstenTokens, ropstenSymbols } from '../../storage/RopstenTokens'
import { rinkebyTokens, rinkebySymbols } from '../../storage/RinkebyTokens'



class TradeModalV3 extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      ShowModal: false,
      Send: 'ETH',
      Recive:'DAI',
      AmountSend:0,
      AmountRecive:0,
      slippageFrom:0,
      slippageTo:0,
      ERRORText:'',
      tokens: null,
      symbols: null,
      sendFrom: '',
      sendTo:'',
      decimalsFrom:18,
      decimalsTo:18,
      prepareData:false,
      shouldUpdatePrice:false,
      exchangePortalVersion:0
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

  componentDidUpdate(prevProps, prevState){
    if(prevState.Send !== this.state.Send
      || prevState.Recive !== this.state.Recive
      || prevState.AmountSend !== this.state.AmountSend
      || prevState.AmountRecive !== this.state.AmountRecive
    ){
      this.setState({ ERRORText:'' })
    }
  }

  // get tokens addresses and symbols from paraswap api
  initData = async () => {
    if(NeworkID === 1){
      // get tokens from api
      try{
        let data = await axios.get(OneInchApi + 'tokens')
        const tokens = []
        const symbols = []

        for (const [, value] of Object.entries(data.data)) {
          symbols.push(value.symbol)
          tokens.push({
            symbol:value.symbol,
            address:value.address,
            decimals:value.decimals
          })
        }

        if(this._isMounted)
          this.setState({ tokens, symbols })
      }catch(e){
        alert("Can not get data from api, please try again latter")
        console.log(e)
      }
    }
    else if (NeworkID === 3){
      // just provide for test few Ropsten tokens from storage
      const tokens = ropstenTokens
      const symbols = ropstenSymbols
      this.setState({ tokens, symbols })
    }
    else if (NeworkID === 4){
      // just provide for test few Ropsten tokens from storage
      const tokens = rinkebyTokens
      const symbols = rinkebySymbols
      this.setState({ tokens, symbols })
    }
    else{
      alert("There are no tokens for your ETH network")
    }

    const exchangePortalVersion = Number(
      await this.getExchangePortalVersion(this.props.smartFundAddress)
    )

    this.setState({ exchangePortalVersion })
  }

  // Show err msg if there are some msg
  ErrorMsg = () => {
    if(this.state.ERRORText.length > 0) {
      return(
        <Alert variant="danger">
        {this.state.ERRORText}
        </Alert>
      )
    }else {
      return null
    }
  }

  // return version of fund Exchange portal
  getExchangePortalVersion = async (fundAddress) => {
    const smartFund = new this.props.web3.eth.Contract(SmartFundABIV7, fundAddress)
    const exchangePortalAddress = await smartFund.methods.exchangePortal().call()
    const exchangePortal = new this.props.web3.eth.Contract(ExchangePortalABIV6, exchangePortalAddress)
    return await exchangePortal.methods.version().call()
  }


  // Check if fund has assets for certain token
  // return true if fund has enougth balance
  checkFundBalance = async () => {
    let fundBalance
    let result = false

    if(String(this.state.sendFrom).toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'){
      fundBalance = await this.props.web3.eth.getBalance(this.props.smartFundAddress)
      fundBalance = this.props.web3.utils.fromWei(fundBalance)
    }
    else{
      const ERC20 = new this.props.web3.eth.Contract(ERC20ABI, this.state.sendFrom)
      fundBalance = await ERC20.methods.balanceOf(this.props.smartFundAddress).call()
      fundBalance = fromWeiByDecimalsInput(this.state.decimalsFrom, fundBalance)
    }
    if(parseFloat(fundBalance) >= parseFloat(this.state.AmountSend))
      result = true

    return result
  }


  // helper for update state
  change = async e => {
    // Update rate in correct direction order and set state
    if(e.target.name === "AmountSend"){
      this.setState({ shouldUpdatePrice:true, slippageTo:0, slippageFrom:0 })
      // get data
      const targetName = e.target.name
      const targerValue = e.target.value
      const { sendFrom, sendTo, decimalsFrom, decimalsTo } = this.getDirectionInfo()
      // get rate and slippage in current order
      const amountRecive = await this.setRate(sendFrom, sendTo, targerValue, "AmountRecive", decimalsFrom, decimalsTo)
      const slippageFrom = await this.getSlippage(sendFrom, sendTo, targerValue, amountRecive, decimalsFrom, decimalsTo)
      // update states
      this.setState({
        [targetName]: targerValue,
        sendFrom,
        sendTo,
        decimalsFrom,
        decimalsTo,
        slippageFrom,
        slippageTo:0,
        shouldUpdatePrice:false
      })
    }
    // Update rate in reverse order direction and set state
    else if(e.target.name === "AmountRecive"){
      this.setState({ shouldUpdatePrice:true, slippageTo:0, slippageFrom:0 })
      // get data
      const targetName = e.target.name
      const targerValue = e.target.value
      const { sendFrom, sendTo, decimalsFrom, decimalsTo } = this.getDirectionInfo()
      // update rate and slippage in vice versa order
      const amountRecive = await this.setRate(sendTo, sendFrom, targerValue, "AmountSend", decimalsTo, decimalsFrom)
      const slippageTo = await this.getSlippage(sendTo, sendFrom, targerValue, amountRecive, decimalsTo, decimalsFrom)
      // update states
      this.setState({
        [targetName]: targerValue,
        sendFrom,
        sendTo,
        decimalsFrom,
        decimalsTo,
        slippageFrom:0,
        slippageTo,
        shouldUpdatePrice:false
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
    const sendFrom = From[0].address

    const To = this.state.tokens.filter(item => item.symbol === this.state.Recive)
    const decimalsTo = To[0].decimals
    const sendTo = To[0].address

    return { sendFrom, sendTo, decimalsFrom, decimalsTo }
  }


  // trade via 1 inch
  tradeViaOneInch = async () => {
    try{
      const oneInchContract = new this.props.web3.eth.Contract(OneInchABI, OneInchProto)
      const smartFund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)
      const block = await this.props.web3.eth.getBlockNumber()
      // get cur tx count
      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + this.props.accounts[0])
      txCount = txCount.data.result

      const amountInWei = toWeiByDecimalsInput(this.state.decimalsFrom, this.state.AmountSend)

      // TODO allow user select slippage  min return
      const minReturn = this.getMinReturn()

      // get gas price from local storage
      const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

      // this function will throw execution with alert warning if there are limit
      await checkTokensLimit(this.state.sendTo, smartFund)

      // get merkle tree data
      const { proof, positions } = getMerkleTreeData(this.state.sendTo)

      // get 1 inch additional data
      const { distribution } = await oneInchContract.methods.getExpectedReturn(
        this.state.sendFrom,
        this.state.sendTo,
        amountInWei,
        10,
        0
      ).call()

      const additionalData = this.props.web3.eth.abi.encodeParameters(
        ['uint256', 'uint256[]'],
        [10, distribution])

      smartFund.methods.trade(
          this.state.sendFrom,
          amountInWei,
          this.state.sendTo,
          2,
          proof,
          positions,
          additionalData,
          minReturn
        )
        .send({ from: this.props.accounts[0], gasPrice })
        .on('transactionHash', (hash) => {
        // pending status for spiner
        this.props.pending(true, txCount+1)
        // pending status for DB
        setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
      })

      this.closeModal()
    }catch(e){
      this.setState({ ERRORText:'Can not verify transaction data, please try again in a minute' })
      console.log("error: ",e)
    }
  }


  // Validation input and smart fund balance
  validation = async () => {
    if(this.state.AmountSend === 0){
      this.setState({ ERRORText:'Please input amount'})
    }else if(this.state.Send === this.state.Recive){
      this.setState({ ERRORText:'Token directions can not be the same'})
    }
    else{
      const status = await this.checkFundBalance()
      if(status){
        this.setState({ prepareData:true })
        this.tradeViaOneInch()
      }else{
        this.setState({ ERRORText:  `Your smart fund don't have enough ${this.state.Send}` })
      }
    }
  }



  /** dev get rate (can calculate by input to or from)
  * params
  * address from and to,
  * input tokens amount
  * type (direction Send or Recieve),
  * decimals token decimals
  */
  setRate = async (from, to, amount, type, decimalsFrom, decimalsTo) => {
    const value = await this.getRate(from, to, amount, decimalsFrom, decimalsTo)
    if(value){
      const result = fromWeiByDecimalsInput(decimalsTo, value)
      this.setState({ [type]: result})
      return result
    }else{
      this.setState({ [type]: 0})
      return 0
    }
  }


  gitRateByNetworkId = async (from, to, amount, decimalsFrom, decimalsTo) => {
    // get value from 1 inch proto
    if(NeworkID === 1){
      const src = toWeiByDecimalsInput(decimalsFrom, amount.toString())
      const srcBN = new BigNumber(src)
      let returnAmount

      // get data from api
      if(this.state.exchangePortalVersion > 4){
        returnAmount = await this.getRateFrom1inchApi(srcBN)
      }
      // get data from blockchain
      else {
        returnAmount = await this.getRateFrom1inchOnchain (from, to, srcBN)
      }

      return returnAmount
    }
    // from test net get value from Bancor via old portal v
    else{
      const portal = new this.props.web3.eth.Contract(ExchangePortalABIV6, ExchangePortalAddressV6)
      const src = toWeiByDecimalsInput(decimalsFrom, amount.toString())
      const srcBN = new BigNumber(src)

      return await portal.methods.getValueViaOneInch(
        from,
        to,
        String(srcBN.toFixed()),
      ).call()
    }
  }

  // get ratio from 1inch or Paraswap (dependse of selected type)
  getRate = async (from, to, amount, decimalsFrom, decimalsTo) => {
    if(amount > 0 && from !== to){
      return await this.gitRateByNetworkId(from, to, amount, decimalsFrom, decimalsTo)
    }
  }

  // get rate from contracts
  getRateFrom1inchOnchain = async (from, to, srcBN) => {
    const oneInchContract = new this.props.web3.eth.Contract(OneInchABI, OneInchProto)
    const { returnAmount } = await oneInchContract.methods.getExpectedReturn(
      from,
      to,
      String(srcBN.toFixed()),
      10,
      0
    ).call()

    return returnAmount
  }

  // get rate from api
  getRateFrom1inchApi = async (srcBN) => {
    const route = `quote?fromTokenSymbol=${this.state.Send}&toTokenSymbol=${this.state.Recive}&amount=${srcBN}`
    const response = await axios.get(OneInchApi + route)
    return response.data.toTokenAmount
  }

  // get slippage percent
  getSlippage = async (sendFrom, sendTo, amountSend, amountRecive, decimalsFrom, decimalsTo) => {
    try{
      const expectedRatio = new BigNumber(
        toWeiByDecimalsInput(decimalsTo, amountRecive)
      )
      const amountSendBN = new BigNumber(amountSend)
      const onePercentFromInput = amountSendBN.minus(amountSendBN.multipliedBy(99).dividedBy(100))
      const ratioForOnePercent = new BigNumber(await this.getRate(
        sendFrom,
        sendTo,
        onePercentFromInput,
        decimalsFrom,
        decimalsTo
      ))

      const realRatio = new BigNumber(ratioForOnePercent.multipliedBy(100))
      const difference = realRatio.minus(expectedRatio)

      const slippage = difference.dividedBy(expectedRatio.dividedBy(100))
      return slippage.dividedBy(2).toFixed(6)
    }catch(e){
      return 0
    }
  }

  // TODO: User can select slipapge percent
  // cut 5% slippage for min return
  getMinReturn(){
    const amountReceive = toWeiByDecimalsInput(this.state.decimalsTo, this.state.AmountRecive)
    const result = new BigNumber(String(amountReceive)).multipliedBy(95).dividedBy(100)

    return new BigNumber(String(Math.floor(result))).toString()
  }

  // update state only when user stop typing
  delayChange = (e) => {
    e.persist()
    this.setState({ [e.target.name]:e.target.value })
    if(this._timeout){ //if there is already a timeout in process cancel it
        clearTimeout(this._timeout)
    }
    this._timeout = setTimeout(async()=>{
       this._timeout = null
       await this.change(e)
    },1000)
  }

  // reset states after close modal
  closeModal = () => this.setState({
    ShowModal: false,
    Send: 'ETH',
    Recive:'DAI',
    AmountSend:0,
    AmountRecive:0,
    prepareData:false,
    slippageFrom:0,
    slippageTo:0
  })

  render() {
    console.log("Trade modal v3, portal version :", this.state.exchangePortalVersion)
   return (
      <div>
        <Button variant="outline-primary" onClick={() => this.setState({ ShowModal: true })}>
          Exchange
        </Button>

          <Modal
          size="lg"
          show={this.state.ShowModal}
          onHide={() => this.closeModal()}
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

          {/* SEND */}
          <Form.Label>Pay with</Form.Label>
          <InputGroup className="mb-3">
          <InputGroup.Prepend>
          <InputGroup.Text>
            <Typeahead
              labelKey="sendTokens"
              multiple={false}
              id="sendTokens"
              options={this.state.symbols}
              onChange={(s) => this.changeByClick("Send", s[0])}
              placeholder={this.state.Send}
            />
          </InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
          type="number"
          placeholder={this.state.AmountSend}
          min="0"
          name="AmountSend"
          value={this.state.AmountSend}
          onChange={e => this.delayChange(e)}
          />
          </InputGroup>
          {
            this.state.slippageTo > 0
            ?
            (
              <small style={{color:"blue"}}>Slippage: {String(this.state.slippageTo)} %</small>
            ):null
          }

          {
            this.state.shouldUpdatePrice ? (<Pending/>) : null
          }
          <br/>

          {/* RECEIVE */}
          <Form.Label>Receive</Form.Label>
          <InputGroup className="mb-3">
          <InputGroup.Prepend>
          <InputGroup.Text>
            <Typeahead
              labelKey="receiveTokens"
              multiple={false}
              id="receiveTokens"
              options={this.state.symbols}
              onChange={(s) => this.changeByClick("Recive", s[0])}
              placeholder={this.state.Recive}
            />
          </InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
          type="number"
          placeholder={this.state.AmountRecive}
          min="0"
          name="AmountRecive"
          value={this.state.AmountRecive}
          onChange={e => this.delayChange(e)}
          />
          </InputGroup>
          {
            this.state.slippageFrom > 0
            ?
            (
              <small style={{color:"blue"}}>Slippage: {String(this.state.slippageFrom)} %</small>
            ):null
          }

          {/* Display error */}
          {this.ErrorMsg()}

          {/* Select DEX aggregator for version >= 6 */}
          {
            this.props.version >= 6
            ?
            (
              <Form.Group>
                <Form.Label><small>Select dex aggregator :</small></Form.Label>

                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">
                Transaction execution prices, and rates may be different in Paraswap and 1inch,
                so we have included two aggregators, for more convenient trading.
                </Tooltip>}>
                <Badge variant="info">
                <small>? info</small>
                </Badge>
                </OverlayTrigger>
              </Form.Group>
            )
            :null
          }

          {/* Trigger tarde */}
          <br />
          <Button variant="outline-primary" onClick={() => this.validation()}>Trade</Button>
          <br />
          {
            this.state.prepareData ? (<small>Preparing transaction data, please wait ...</small>) : null
          }

          {/* Update gas price */}
          <br />
          {
            this.props.web3 ? <SetGasPrice web3={this.props.web3}/> : null
          }
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
export default TradeModalV3

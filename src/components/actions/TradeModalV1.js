// Modal for trade only via Kyber
import React, { Component } from 'react'
import { SmartFundABI, KyberInterfaceABI, KyberAddress, ERC20ABI, APIEnpoint } from '../../config.js'
import { Button, Modal, Form, Alert, InputGroup } from "react-bootstrap"
import setPending from '../../utils/setPending'
import axios from 'axios'
import { tokens } from '../../storage/tokens/'
import { Typeahead } from 'react-bootstrap-typeahead'
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../utils/weiByDecimals'
import checkTokensLimit from '../../utils/checkTokensLimit'
import SetGasPrice from '../settings/SetGasPrice'
import coinPics from '../../storage/tokens/coinPics'

class TradeModalV1 extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      ShowModal: false,
      Send: 'ETH',
      Recive:'KNC',
      AmountSend:0,
      AmountRecive:0,
      ERRORText:'',
      symbols:[],
      tokenAddress:undefined
    }
  }

  _isMounted = false
  componentDidMount(){
    this._isMounted = true
    const symbols = tokens.ALLTokens
    if(this._isMounted)
      this.setState({ symbols })
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

  // get fund balance for a certain asset
  // return from wei
  getBalance = async () => {
    if(this.state.Send === 'ETH'){
      const ethBalance = await this.props.web3.eth.getBalance(this.props.smartFundAddress)
      return fromWeiByDecimalsInput(18, ethBalance)
    }else{
      const tokenAddress = tokens[this.state.Send]
      const ERC20 = new this.props.web3.eth.Contract(ERC20ABI, tokenAddress)
      const decimals = await ERC20.methods.decimals().call()
      const ercBalance = await ERC20.methods.balanceOf(this.props.smartFundAddress).call()
      return fromWeiByDecimalsInput(decimals, ercBalance)
    }
  }

  getDecimals = async (tokenAddress) => {
    const ERC20 = new this.props.web3.eth.Contract(ERC20ABI, tokenAddress)
    return await ERC20.methods.decimals().call()
  }

  change = e => {
    if(e.target.name === "AmountSend"){
      this.setRate(tokens[this.state.Send], tokens[this.state.Recive], e.target.value, "AmountRecive", "AmountSend")
      this.setState({
        [e.target.name]: e.target.value
      })
    }
    else if(e.target.name === "AmountRecive"){
      this.setRate(tokens[this.state.Recive], tokens[this.state.Send], e.target.value, "AmountSend", "AmountRecive")
      this.setState({
        [e.target.name]: e.target.value
      })
    }
    else{
      this.setState({
      [e.target.name]: e.target.value
      })
    }
  }

  changeByClick = (name, param) => {
    this.setState({
      [name]:param,
      AmountSend:0,
      AmountRecive:0
    })
  }


  trade = async () =>{
  // get contract
  const contract = new this.props.web3.eth.Contract(SmartFundABI, this.props.smartFundAddress)

  // convert amount
  let amount
  if(this.state.Send === 'ETH'){
    amount = toWeiByDecimalsInput(18, this.state.AmountSend)
  }else{
    const decimals = await this.getDecimals(tokens[this.state.Send])
    amount = toWeiByDecimalsInput(decimals, this.state.AmountSend)
  }

  // get cur tx count
  let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + this.props.accounts[0])
  txCount = txCount.data.result

  // this function will throw execution with alert warning if there are limit
  await checkTokensLimit(tokens[this.state.Recive], contract)

  // hide modal
  this.closeModal()

  // get gas price from local storage
  const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

  // execude trade
  let block = await this.props.web3.eth.getBlockNumber()

  contract.methods.trade(
    tokens[this.state.Send],
    amount,
    tokens[this.state.Recive],
    0,
    tokens.KyberParametrs).send({ from: this.props.accounts[0], gasPrice})
    .on('transactionHash', (hash) => {
    // pending status for spiner
    this.props.pending(true, txCount+1)
    // pending status for DB
    setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
    })
  }

  /**
  * This internal function for calculate rate and setstate for send or recive
  * @param {from} symbol of token
  * @param {to} symbol of token
  * @param {amount} amount of token
  * @param {type} state "AmountRecive" or "AmountSend"
  * @param {mul} state "AmountRecive" or "AmountSend" (we need mul Kyber result)
  */
  setRate = async (from, to, amount, type, mul) => {
    if(amount > 0){
    const contract = new this.props.web3.eth.Contract(KyberInterfaceABI, KyberAddress)
    // convert src to wei by decimals
    let src
    if(String(from).toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'){
      src = toWeiByDecimalsInput(18, amount)
    }else{
      const decimals = await this.getDecimals(from)
      src = toWeiByDecimalsInput(decimals, amount)
    }

    // get expected rate
    const rate = await contract.methods.getExpectedRate(from, to, src).call()
    if(rate){
      // convert expected rate from wei
      let rateFromWei
      if(String(from).toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'){
        rateFromWei = fromWeiByDecimalsInput(18, this.props.web3.utils.hexToNumberString(rate.expectedRate._hex))
      }else{
        const decimals = await this.getDecimals(from)
        rateFromWei= fromWeiByDecimalsInput(decimals, this.props.web3.utils.hexToNumberString(rate.expectedRate._hex))
      }
      // mul expected rate
      const ratio = rateFromWei * this.state[mul]
      // cut 1% slippage
      const final = ratio * 99 / 100
      this.setState({ [type]: final })
    }else{
      this.setState({ [type]: 0 })
    }
   }
  }

  validation = async () => {
    if(this.state.AmountSend === 0){
      this.setState({ ERRORText:'Please input amount'})
    }else if(this.state.Send === this.state.Recive){
      this.setState({ ERRORText:'Token directions can not be the same'})
    }
    else{
      const currentBalance = await this.getBalance()
      if(currentBalance && currentBalance >= this.state.AmountSend){
        this.trade()
      }else{
        this.setState({ ERRORText:  `Your smart fund don't have enough ${this.state.Send}` })
      }
    }
  }

  closeModal = () => this.setState({
    ShowModal: false,
    Send: 'ETH',
    Recive:'KNC',
    AmountSend:0,
    AmountRecive:0,
    ERRORText:'',
    tokenAddress:undefined
  })

  render() {
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

          <Form>
          {/*SEND*/}
          <Form.Label>Pay with </Form.Label>
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
               renderMenuItemChildren={(options, props) => (
                 <div>
                   <img style={{height: "35px", width: "35px"}}src={`${coinPics(options)}`} alt="Logo" />
                   &nbsp; &nbsp;
                   {options}
                 </div>
               )}
             />
           </InputGroup.Text>
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

          {/*RECEIVE*/}
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
               renderMenuItemChildren={(options, props) => (
                 <div>
                   <img style={{height: "35px", width: "35px"}}src={`${coinPics(options)}`} alt="Logo" />
                   &nbsp; &nbsp;
                   {options}
                 </div>
               )}
             />
           </InputGroup.Text>
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

          {this.ErrorMsg()}

          <br />
          <Button variant="outline-primary" onClick={() => this.validation()}>Trade</Button>

          {/* Update gas price */}
          <br />
          {
            this.props.web3 ? <SetGasPrice web3={this.props.web3}/> : null
          }
           </Form>
          </Modal.Body>
        </Modal>
        </div>
    )
  }
}

export default TradeModalV1

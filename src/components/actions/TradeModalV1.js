// Modal for trade only via Kyber
import React, { Component } from 'react'
import { SmartFundABI, KyberInterfaceABI, KyberAddress, ERC20ABI } from '../../config.js'
import { Button, Modal, Form, Alert, InputGroup } from "react-bootstrap"
import setPending from '../../utils/setPending'

import { tokens } from '../../tokens/'
import { Typeahead } from 'react-bootstrap-typeahead'
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../utils/weiByDecimals'

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

  componentDidMount(){
    const symbols = tokens.ALLTokens
    this.setState({ symbols })
  }

  componentWillUnmount(){

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
  const contract = new this.props.web3.eth.Contract(SmartFundABI, this.props.smartFundAddress)

  // convert amount
  let amount
  if(this.state.Send === 'ETH'){
    amount = toWeiByDecimalsInput(18, this.state.AmountSend)
  }else{
    const decimals = await this.getDecimals(tokens[this.state.Send])
    amount = toWeiByDecimalsInput(decimals, this.state.AmountSend)
  }

  console.log(amount)


  this.setState({ ShowModal: false })

  let block = await this.props.web3.eth.getBlockNumber()

  contract.methods.trade(
    tokens[this.state.Send],
    amount,
    tokens[this.state.Recive],
    0,
    tokens.KyberParametrs).send({ from: this.props.accounts[0]})
    .on('transactionHash', (hash) => {
    console.log(hash)
    // pending status for spiner
    this.props.pending(true)
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
    if(amount){
    const contract = new this.props.web3.eth.Contract(KyberInterfaceABI, KyberAddress)
    // TODO CALCULATE BY DECIMALS NOT ONLY BY 18
    const src = this.props.web3.utils.toWei(amount.toString(), 'ether')
    const value = await contract.methods.getExpectedRate(from, to, src).call()
    if(value){
      // TODO CALCULATE BY DECIMALS NOT ONLY BY 18
      const result = this.props.web3.utils.fromWei(this.props.web3.utils.hexToNumberString(value.expectedRate._hex))
      const final = result * this.state[mul] // mul need only for Kyber
      this.setState({ [type]: final })
    }else{
      this.setState({ [type]: 0 })
    }
   }
  }

  validation = async () => {
    const currentBalance = await this.getBalance()
    if(currentBalance && currentBalance >= this.state.AmountSend){
      this.trade()
    }else{
      this.setState({ ERRORText:  `Your smart fund don't have enough ${this.state.Send}` })
    }
  }

  render() {
   let CloseModal = () => this.setState({
     ShowModal: false,
     Send: 'ETH',
     Recive:'KNC',
     AmountSend:0,
     AmountRecive:0,
     ERRORText:'',
     tokenAddress:undefined
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

          <Form>
          {/*SEND*/}
          <Form.Label>Pay with: {this.state.Send}</Form.Label>
          <InputGroup className="mb-3">
          <InputGroup.Prepend>
           <InputGroup.Text>
             <Typeahead
               labelKey="sendTokens"
               multiple={false}
               id="sendTokens"
               options={this.state.symbols}
               onChange={(s) => this.changeByClick("Send", s[0])}
               placeholder="Choose a symbol"
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
          <Form.Label>Receive: {this.state.Recive}</Form.Label>
          <InputGroup className="mb-3">
          <InputGroup.Prepend>
           <InputGroup.Text>
             <Typeahead
               labelKey="receiveTokens"
               multiple={false}
               id="receiveTokens"
               options={this.state.symbols}
               onChange={(s) => this.changeByClick("Recive", s[0])}
               placeholder="Choose a symbol"
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
          <Button variant="outline-primary" onClick={() => this.validation()}>Execute trade</Button>
           </Form>
          </Modal.Body>
        </Modal>
        </div>
    )
  }
}

export default TradeModalV1

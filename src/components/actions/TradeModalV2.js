// Modal for trade via Paraswap (Kyber, Bancor, Uniswap)
import React, { Component } from 'react'
import { SmartFundABI, APIEnpoint, ParaswapApi, NeworkID } from '../../config.js'
import { Button, Modal, Form, Alert, Dropdown, InputGroup } from "react-bootstrap"
import setPending from '../../utils/setPending'
import axios from 'axios'

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
      tokens: null
    }
  }

  mounted = true
  componentDidMount = async () => {
    this.mounted = true
    if(this.mounted)
       this.initData()
  }

  componentWillUnmount(){
    this.mounted = false
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
      this.setState({ tokens, symbols })
    }catch(e){
      alert("Can not get data from api, please try again latter")
      console.log(e)
    }
  }

  errorShow = (bool) => {
    this.setState({ AlertError:bool })
  }

  checkBalance = async () => {
    const result = await axios.get(APIEnpoint + 'api/smartfund/' +this.props.smartFundAddress)
    const tokenInfo = JSON.parse(result.data.result.balance)
    const info = tokenInfo.find(el => el.symbol === this.state.Send)

    if(info){
      return info.balance
    }
    else{
      return null
    }
  }

  // helper for update state by onchange
  change = e => {
    // Update rate and set state
    if(e.target.name === "AmountSend"){
      const { sendFrom, sendTo } = this.getDirectionAddresses()
      // set rate in correct direction order
      this.setRate(sendFrom, sendTo, e.target.value, "AmountRecive", "AmountSend")
      this.setState({
        [e.target.name]: e.target.value
      })
    }
    else if(e.target.name === "AmountRecive"){
      const { sendFrom, sendTo } = this.getDirectionAddresses()
      console.log(sendFrom, sendTo)
      // set rate in reverse order direction
      this.setRate(sendTo, sendFrom, e.target.value, "AmountSend", "AmountRecive")
      this.setState({
        [e.target.name]: e.target.value
      })
    }
    // Just set state
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

  // found addresses by direction symbols
  getDirectionAddresses = () => {
    let sendFrom = this.state.tokens.filter(item => item.symbol.includes(this.state.Send))
    sendFrom = sendFrom[0].addresses[NeworkID]

    let sendTo = this.state.tokens.filter(item => item.symbol.includes(this.state.Recive))
    sendTo = sendTo[0].addresses[NeworkID]

    return { sendFrom, sendTo }
  }

  packDataToBytes32Array = async () => {

  }

  trade = async () =>{
    alert('Should trade from paraswap')
  }


  setRate = async (from, to, amount, type, mul) => {
    alert('Should check rate from paraswap')
  }

  validation = async () => {
    // const currentBalance = await this.checkBalance()
    // const requiredBalance = this.props.web3.utils.toWei(this.state.AmountSend.toString(), 'ether')
    //
    // if(currentBalance && currentBalance >= requiredBalance && requiredBalance > 0){
    //   this.trade()
    // }else{
    //   this.errorShow(true)
    // }
    this.trade()
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
              "ERROR: Not enought funds in this SmartFund or input amount 0"
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

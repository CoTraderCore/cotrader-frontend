import React, { Component } from 'react'
import {
  SmartFundABI,
  KyberInterfaceABI,
  KyberAddress,
  APIEnpoint,
  ABIBancorNetwork,
  BancorNetwork
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
import getBancorPath from '../../utils/getBancorPath'
import axios from 'axios'
import kyberStorage from '../../tokens/kyberStorage'
import bancorStorage from '../../tokens/bancorStorage'
import { coinPics } from '../../tokens/tokensHelpers'
import { padLeft, hexToBytes } from 'web3-utils'

class TradeModal extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      ShowModal: false,
      Send: 'ETH',
      Recive:'ETH',
      AmountSend:0,
      AmountRecive:0,
      AlertError:false,
      TradeType:0
    }
  }

  componentDidMount() {
    const tokensArray = kyberStorage.ALLTokens
    this.setState({ tokensArray })
  }

  componentDidUpdate(prevProps, prevState) {
    // change token storage if user change exchange type
    if(prevState.TradeType !== this.state.TradeType){
      const tokensArray = this.state.TradeType === 0 ? kyberStorage.ALLTokens : bancorStorage.map(item => item.symbol)
      this.setState({
        tokensArray,
        AmountSend:0,
        AmountRecive:0
       })
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

  // Helper
  change = e => {
    this.setState({
    [e.target.name]: e.target.value
    })

    if(e.target.name === "AmountSend"){
      this.setRate(e.target.value, "AmountRecive", "AmountSend")

    }
    if(e.target.name === "AmountRecive"){
      this.setRate(e.target.value, "AmountSend", "AmountRecive")
    }
  }

  // Helper
  // Change send or recieve tokens direction
  // Drop send and recieve amount
  changeByClick = (name, param) => {
    this.setState({
      [name]:param,
      AmountSend:0,
      AmountRecive:0
    })
  }

  // return parameters depending on type (Kyber or Bancor)
  tradeParameters = () => {
    const amount = this.props.web3.utils.toWei(this.state.AmountSend.toString(), 'ether')
    let params
    // Kyber
    if(this.state.TradeType === 0){
      params = [kyberStorage[this.state.Send],
      amount,
      kyberStorage[this.state.Recive],
      0,
      kyberStorage.KyberParametrs]
    }
    // Bancor
    else if(this.state.TradeType === 1){
      const bancorPath = getBancorPath(this.state.Send, this.state.Recive, bancorStorage)
      let additionBytes32 = []

      for(let i=1; i < bancorPath.length -1; i++){
        const item = padLeft(hexToBytes(bancorPath[i], 32))
        additionBytes32.push(item)
      }

      params = [
        bancorPath[0], // to
        amount,
        bancorPath[bancorPath.length-1], // from
        1,
        additionBytes32
      ]
    }
    else{
      alert('Unknown exchange type')
    }
    return params
  }

  // Trade via smart fund
  trade = async () =>{
  const contract = new this.props.web3.eth.Contract(SmartFundABI, this.props.smartFundAddress)
  const block = await this.props.web3.eth.getBlockNumber()
  const parameters = this.tradeParameters()

  contract.methods.trade(...parameters).send({ from: this.props.accounts[0]}
    )
    .on('transactionHash', (hash) => {
    console.log(hash)
    // pending status for spiner
    this.props.pending(true)
    // pending status for DB
    setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
    })
    this.setState({ ShowModal: false })
  }

  /**
  * This internal function for calculate rate and setstate for send or recive (dependse of input)
  * @param {amount} amount of token
  * @param {type} state "AmountRecive" or "AmountSend"
  * @param {mul} state "AmountRecive" or "AmountSend"
  */
  setRate = async (amount, type, mul) => {
    if(amount && this.state.Send !== this.state.Recive){
    // Kyber
    if(this.state.TradeType === 0){
      const from = kyberStorage[this.state.Send]
      const to = kyberStorage[this.state.Recive]
      const contract = new this.props.web3.eth.Contract(KyberInterfaceABI, KyberAddress)
      const src = this.props.web3.utils.toWei(amount.toString(), 'ether')
      const value = await contract.methods.getExpectedRate(from, to, src).call()
      if(value){
        const result = this.props.web3.utils.fromWei(this.props.web3.utils.hexToNumberString(value.expectedRate._hex))
        // mul result
        const final = result * this.state[mul]
        this.setState({ [type]: final })
      }else{
        this.setState({ [type]: 0 })
      }
    }
    // Bancor
    else if(this.state.TradeType === 1){
      const pathRecieve = [this.state.Send, this.state.Recive]
      const pathSend = [this.state.Recive, this.state.Send]
      const path = type === 'AmountRecive' ? getBancorPath(...pathRecieve, bancorStorage) : getBancorPath(...pathSend, bancorStorage)
      const contract = new this.props.web3.eth.Contract(ABIBancorNetwork, BancorNetwork)
      amount = this.props.web3.utils.toWei(amount.toString(), 'ether')
      const value = await contract.methods.getReturnByPath(path, amount).call()
      if(value){
        const result = this.props.web3.utils.fromWei(this.props.web3.utils.hexToNumberString(value[0]._hex))
        const final = result * this.state[mul]
        this.setState({ [type]: final })
      }else{
        this.setState({ [type]: 0 })
      }
    }
    else{
      alert('Unknown exchange type')
    }
   }
  }

  validation = async () => {
    const currentBalance = await this.checkBalance()
    const requiredBalance = this.props.web3.utils.toWei(this.state.AmountSend.toString(), 'ether')

    if(currentBalance && currentBalance >= requiredBalance && requiredBalance > 0){
      this.trade()
    }else{
      this.errorShow(true)
    }
  }

  render() {
   let CloseModal = () => this.setState({
     ShowModal: false,
     Send: 'ETH',
     Recive:'ETH',
     AmountSend:0,
     AmountRecive:0,
     TradeType:0
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
          <small>Current exchange: {this.state.TradeType === 0 ? <strong>Kyber</strong> : <strong>Bancor</strong>}</small>
          <Dropdown>
          <Dropdown.Toggle variant="outline-primary">
          Select Exchange
          </Dropdown.Toggle>
          <Dropdown.Menu style={{"height":"80px", "overflowY":"scroll"}}>

          <Dropdown.Item
          key="TypeKyber"
          onClick={() => this.setState({ TradeType:0 })}
          ><img src={coinPics("KNC") } alt={coinPics("KNC")} width="19" height="15"/>KYBER</Dropdown.Item>

          <Dropdown.Item
          key="TypeBancor"
          onClick={() => this.setState({ TradeType:1 })}
          ><img src={coinPics("BNT") } alt={coinPics("BNT")} width="19" height="15"/>BANCOR</Dropdown.Item>
          </Dropdown.Menu>

          </Dropdown>
          <hr/>
          <Form.Label>Send: {this.state.Send}</Form.Label>
          <InputGroup className="mb-3">
          <InputGroup.Prepend>
          <Dropdown>
          <Dropdown.Toggle variant="outline-primary">
          Select token
          </Dropdown.Toggle>
          {
            this.state.tokensArray
            ?
            (
              <Dropdown.Menu style={{"height":"290px", "overflowY":"scroll"}}>
              {this.state.tokensArray.map((value, index) => {
              return <Dropdown.Item onClick={() => this.changeByClick("Send", value)} key={index}><img src={coinPics(value)} alt="?_" width="19" height="15"/> {value}</Dropdown.Item>
              })}
              </Dropdown.Menu>
            )
            :(null)
          }
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
          {
            this.state.tokensArray
            ?
            (
              <Dropdown.Menu style={{"height":"250px", "overflowY":"scroll"}}>
              {this.state.tokensArray.map((value, index) => {
              return <Dropdown.Item onClick={() => this.changeByClick("Recive", value)} key={index}><img src={coinPics(value)} alt="?_" width="19" height="15"/> {value}</Dropdown.Item>
              })}
              </Dropdown.Menu>
            )
            :(null)
          }
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
          </Modal.Body>
        </Modal>
        </div>
    )
  }
}

export default TradeModal

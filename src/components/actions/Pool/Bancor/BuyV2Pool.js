// Buy by connectors amount
// get all connectors by selected token

import React, { PureComponent } from 'react'
import { Form, Button, Alert } from "react-bootstrap"
import {
  SmartFundABIV7,
  BancorConverterABI,
  ERC20ABI,
  ERC20Bytes32ABI,
} from '../../../../config.js'
import setPending from '../../../../utils/setPending'
import { toWeiByDecimalsInput } from '../../../../utils/weiByDecimals'

class BuyV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context)
    this.state = {
      connectors:[],
      showSpinner:false
    }
  }

  componentDidMount(){
    this.updateConnectorsData()
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.converterAddress !== this.props.converterAddress)
      this.updateConnectorsData()
  }

  addLiquidity = async () => {
    const connectorsAddress = this.state.connectors.map(item => item.address)
    const connectorsAmount = this.state.connectors.map(item => item.amount)
    const smartFund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)

    // encode additional data in bytes
    const data = this.props.web3.eth.abi.encodeParameters(
      ['address[]', 'uint256[]', 'uint256'],
      [connectorsAddress, connectorsAmount, 1]
    )

    // get gas price from local storage
    const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000
    const block = await this.props.web3.eth.getBlockNumber()

    // buy pool
    smartFund.methods.buyPool(
      0, // for Bancor v2 we calculate pool amount by connectors
      0, // type Bancor
      this.props.fromAddress, // pool address
      connectorsAddress,
      connectorsAmount,
      ['0x000000000000000000000000000000000000000000000000000000000000001c'], // TODO convert converter version to bytes32
      data
    )
    .send({ from:this.props.accounts[0], gasPrice })
    .on('transactionHash', (hash) => {
    // pending status for spiner
    this.props.pending(true)
    // pending status for DB
    setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
    })

    // close pool modal
    this.props.modalClose()
  }

  // get connectors by converter address
  updateConnectorsData = async () => {
    if(this.props.converterAddress){
      this.setState({ showSpinner:true })

      const converter = new this.props.web3.eth.Contract(BancorConverterABI, this.props.converterAddress)
      const connectorsCount = await converter.methods.connectorTokenCount().call()
      const connectors = []

      for(let i = 0; i < connectorsCount; i++){
        const address = await converter.methods.connectorTokens(i).call()
        const { symbol, decimals } = await this.getTokenSymbolAndDecimals(address)
        connectors.push({ symbol, address, amount:0, decimals })
      }

      this.setState({ connectors, showSpinner:false })
    }
  }

  // find a certain connector by symbol and update amount
  updateConnectorAmount = (symbol, amount) => {
    const searchObj = this.state.connectors.filter((item) => {
    return item.symbol === symbol
    })
    // TODO: convert  to wei by decimals
    searchObj[0].amount = toWeiByDecimalsInput(searchObj[0].decimals, amount)
    console.log(this.state.connectors)
  }

  getTokenSymbolAndDecimals = async (address) => {
    // ETH case
    if(String(address).toLowerCase() === String('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE').toLowerCase()){
      return { symbol: 'ETH', decimals: 18}
    }
    else{
      // ERC20 String return case
      try{
        const token = new this.props.web3.eth.Contract(ERC20ABI, address)
        const symbol = await token.methods.symbol().call()
        const decimals = await token.methods.decimals().call()
        return { symbol, decimals }
      }
      // EC20 Bytes32 return case
      catch(e){
        const token = new this.props.web3.eth.Contract(ERC20Bytes32ABI, address)
        const symbol = await this.props.web3.utils.toUtf8(token.methods.symbol().call())
        const decimals = await token.methods.decimals().call()
        return { symbol, decimals }
      }
    }
  }



  render() {
    return (
      <>
      {
        this.state.showSpinner ? (<>Updating ...</>) : null
      }
      {
        this.state.connectors && this.state.connectors.length > 0
        ?
        (
          <Form>
          <Form.Label><small>Note: for Bancor v2 we calculate pool amount by pool conenctors</small></Form.Label>
          {
            this.state.connectors.map((item, index) => {
              return(
                <Form.Group key={index}>
                 <Form.Label>Enter amount of { item.symbol }</Form.Label>
                 <Form.Control
                 name={item.symbol}
                 type="number"
                 min="1"
                 onChange={(e) => this.updateConnectorAmount(e.target.name, e.target.value)}/>
               </Form.Group>
              )
            })
          }
          <Button variant="outline-primary" onClick={() => this.addLiquidity()}>Buy</Button>
          </Form>
        )
        :null
      }
      </>
    )
  }

}

export default BuyV2Pool

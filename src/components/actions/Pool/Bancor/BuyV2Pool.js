// Buy by connectors amount
// get all connectors by selected token

import React, { PureComponent } from 'react'
import { Form, Button, Alert } from "react-bootstrap"
import {
  PoolPortalV6,
  PoolPortalABIV7,
  SmartFundABIV7,
  BancorConverterABI,
  ERC20ABI,
  ERC20Bytes32ABI,
  EtherscanLink
} from '../../../../config.js'


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
    searchObj[0].amount = amount
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
          </Form>
        )
        :null
      }
      </>
    )
  }

}

export default BuyV2Pool

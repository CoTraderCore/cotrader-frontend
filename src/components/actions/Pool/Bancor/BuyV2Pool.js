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

  updateConnectorsData = async () => {
    if(this.props.converterAddress){
      this.setState({ showSpinner:true })

      const converter = new this.props.web3.eth.Contract(BancorConverterABI, this.props.converterAddress)
      const connectorsCount = await converter.methods.connectorTokenCount().call()
      const connectors = []

      for(let i = 0; i < connectorsCount; i++){
        const address = await converter.methods.connectorTokens(i).call()
        const symbol = await this.getTokenSymbol(address)
        connectors.push({ symbol, address })
      }

      this.setState({ connectors, showSpinner:false })
    }
  }

  getTokenSymbol = async (address) => {
    // ETH case
    if(String(address).toLowerCase() === String('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE').toLowerCase()){
      return 'ETH'
    }
    else{
      // ERC20 String return case
      try{
        const token = new this.props.web3.eth.Contract(ERC20ABI, address)
        return await token.methods.symbol().call()
      }
      // EC20 Bytes32 return case
      catch(e){
        const token = new this.props.web3.eth.Contract(ERC20Bytes32ABI, address)
        return await this.props.web3.utils.toUtf8(token.methods.symbol().call())
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
                 <Form.Control type="number" />
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

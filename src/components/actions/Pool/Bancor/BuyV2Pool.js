// Buy pool by connectors amount
// This componnent support both new Bancor converter type 1 and 2

import React, { PureComponent } from 'react'
import { Form, Button, Alert } from "react-bootstrap"

import {
  SmartFundABIV7,
  BancorConverterABI,
  ERC20ABI,
  ERC20Bytes32ABI,
  BancorSmartTokenABI
} from '../../../../config.js'

import setPending from '../../../../utils/setPending'

import {
  toWeiByDecimalsInput,
  fromWeiByDecimalsInput
} from '../../../../utils/weiByDecimals'

import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'
import { fromWei } from 'web3-utils'
import Loading from '../../../templates/Spiners/Loading'


class BuyV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context)
    this.state = {
      connectors:[],
      showSpinner:false,
      ErrorText:''
    }
  }

  componentDidMount(){
    this.updateConnectorsData()
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.converterAddress !== this.props.converterAddress)
      this.updateConnectorsData()

    if(prevState.connectors !== this.state.connectors)
      this.setState({ ErrorText:'' })
  }

  // this method work with both new Bancor converter types
  // 1 - (multiple connectors) and 2 -(single connector)
  addLiquidity = async () => {
    // check if enough balance
    const isEnoughBalance = await this.checkInputBalance(this.state.connectors)
    if(isEnoughBalance){
      // get connectors addresses and amount
      const connectorsAddress = this.state.connectors.map(item => item.address)
      const connectorsAmount = this.state.connectors.map(item => item.amount)
      // get smart fund contract
      const smartFund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)
      // get gas price from local storage
      const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000
      // get block number
      const block = await this.props.web3.eth.getBlockNumber()
      // get poolToken
      const poolToken = this.props.converterType === 2
      ? await this.extractType2PoolToken(connectorsAddress[0], this.props.converterAddress)
      : this.props.fromAddress

      console.log("poolToken", poolToken)

      // get params for buying pool according to converter type
      let params = [
        0, // for Bancor v2 we calculate pool amount by connectors
        0, // type Bancor
        poolToken,
        connectorsAddress,
        connectorsAmount,
        [
          numStringToBytes32(String(this.props.converterVersion)),
          numStringToBytes32(String(this.props.converterType))
        ],
        this.props.web3.eth.abi.encodeParameters(
          ['uint256'],
          [1]
        )
      ]

      // buy pool
      smartFund.methods.buyPool(
        ...params
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
    }else{
      this.setState({
         ErrorText:"You do not have enough assets in the fund for this operation"
      })
    }
  }

  // extract pool token
  // need only for type 2 
  extractType2PoolToken = async (tokenConnector, converterAddress) => {
    const converter = new this.props.web3.eth.Contract(BancorConverterABI, converterAddress)
    return await converter.methods.poolToken(tokenConnector).call()
  }

  // get connectors by converter address
  updateConnectorsData = async () => {
      this.setState({ showSpinner:true })
      const connectors = []

      // multiple connectots case
      if(this.props.converterType === 1){
        if(this.props.converterAddress){
          const converter = new this.props.web3.eth.Contract(BancorConverterABI, this.props.converterAddress)
          const connectorsCount = await converter.methods.connectorTokenCount().call()

          for(let i = 0; i < connectorsCount; i++){
            const address = await converter.methods.connectorTokens(i).call()
            const { symbol, decimals } = await this.getTokenSymbolAndDecimals(address)
            connectors.push({ symbol, address, amount:0, decimals })
          }
        }
      }
      // single conenctor case
      else{
        if(this.props.poolSourceTokenAddress){
          console.log("this.props.poolSourceTokenAddress", this.props.poolSourceTokenAddress)
          const address = this.props.poolSourceTokenAddress
          const { symbol, decimals } = await this.getTokenSymbolAndDecimals(address)
          connectors.push({ symbol, address, amount:0, decimals })
        }
      }


      this.setState({ connectors, showSpinner:false })

  }

  // find a certain connector by symbol and update amount
  updateConnectorAmount = (symbol, amount) => {
    const searchObj = this.state.connectors.filter((item) => {
    return item.symbol === symbol
    })
    // TODO: convert  to wei by decimals
    searchObj[0].amount = toWeiByDecimalsInput(searchObj[0].decimals, amount)
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

  // return false if not enough balance on fund for a some certain token
  checkInputBalance = async (tokensData) => {
  // check
    for(const item of tokensData){
      const curInput = fromWeiByDecimalsInput(item.decimals, item.amount)
      let curBalance
      // ERC20 case
      if(String(item.address).toLowerCase() !== String('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE').toLowerCase()){
        const token = new this.props.web3.eth.Contract(ERC20ABI, item.address)
        const fundBalance = await token.methods.balanceOf(this.props.smartFundAddress).call()
        curBalance = fromWeiByDecimalsInput(item.decimals, fundBalance)
      }
      // ETH case
      else{
        curBalance = fromWei(await this.props.web3.eth.getBalance(this.props.smartFundAddress))
      }
      // compare
      if(parseFloat(curInput) > parseFloat(curBalance))
        return false
    }
    return true
  }


  render() {
    return (
      <>
      {
        this.state.showSpinner
        ?
        (
          <>
          <Loading/>
          <div align="center">
          <small>checking pool version ...</small>
          </div>
          </>
        ) : null
      }
      {
        this.props.version >= 7
        ?
        (
          <>
          {
            this.state.connectors && this.state.connectors.length > 0
            ?
            (
              <Form>
              {
                this.props.converterType === 1
                ?
                (
                  <Form.Label><small>Note: for new Bancor type 1 we calculate pool amount by multiple pool conenctors</small></Form.Label>
                )
                :
                (
                  <Form.Label><small>Note: for new Bancor type 2 we calculate pool amount by single pool conenctor</small></Form.Label>
                )
              }
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
              {
                this.state.ErrorText.length > 0
                ?
                (
                  <Alert variant="danger">{ this.state.ErrorText }</Alert>
                )
                :null
              }
              <Button variant="outline-primary" onClick={() => this.addLiquidity()}>Buy</Button>
              </Form>
            )
            :null
          }
          </>
        ):
        <Alert variant="warning">Sorry your curent fund version not support this pool token</Alert>
      }
      </>
    )
  }

}

export default BuyV2Pool

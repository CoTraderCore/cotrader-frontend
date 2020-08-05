import React, { PureComponent } from 'react'
import { Form, Button, Alert } from "react-bootstrap"
import setPending from '../../../../utils/setPending'
import {
  SmartFundABIV7,
  BancorConverterABI,
  BancorFormulaABI,
  GetBancorDataABI,
  GetBancorData,
  ERC20ABI
} from '../../../../config.js'
import { toWei, fromWei } from 'web3-utils'

class SellV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context)
    this.state = {
      poolAmount:0,
      ErrorText:''
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.fromAddress !== this.props.fromAddress || prevState.poolAmount !== this.state.poolAmount){
      this.setState({ ErrorText:''})
    }
  }

  removeLiqudity = async () => {
    if(this.state.poolAmount > 0){
      const poolAmountFromWei = await this.getFundBalance(this.props.fromAddress)
      if(poolAmountFromWei >= this.state.poolAmount){
        const connectorsAddress = await this.getConnectors(this.props.converterAddress)
        const reserveMinReturnAmounts = Array(connectorsAddress.length).fill([1]) // for test
        const smartFund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)

        // get gas price from local storage
        const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000
        const block = await this.props.web3.eth.getBlockNumber()

        // encode additional data in bytes
        const data = this.props.web3.eth.abi.encodeParameters(
          ['address[]', 'uint256[]'],
          [connectorsAddress, reserveMinReturnAmounts]
        )

        // sell pool
        smartFund.methods.sellPool(
          toWei(String(this.state.poolAmount)),
          0, // type Bancor
          this.props.fromAddress, // pool address
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
      else{
        this.setState({ ErrorText: "Not enough balance in your fund" })
      }
    }else{
      this.setState({ ErrorText: "Not correct pool amount" })
    }
  }

  getConnectors = async (converterAddress) => {
    if(converterAddress){
      const converter = new this.props.web3.eth.Contract(BancorConverterABI, converterAddress)
      const connectorsCount = await converter.methods.connectorTokenCount().call()
      const connectors = []

      for(let i = 0; i < connectorsCount; i++){
        const address = await converter.methods.connectorTokens(i).call()
        connectors.push(address)
      }

      return connectors
    }
  }

  // TODO
  getConnectorsMinReturn = async (connectors) => {
    //  BancorFormula.liquidateReserveAmount for get minReturn
    const GetBancorData = new this.props.web3.eth.Contract(GetBancorDataABI, GetBancorData)
    const BancorFormulaAddress = await GetBancorData.methods.getBancorContractAddresByName(
      "BancorFormula"
    ).call()
    const BancorFormula = new this.props.web3.eth.Contract(BancorFormulaABI, BancorFormulaAddress)
  }

  getFundBalance = async (poolTokenAddress) => {
    const poolToken = new this.props.web3.eth.Contract(ERC20ABI, poolTokenAddress)
    return fromWei(String(await poolToken.methods.balanceOf(this.props.smartFundAddress).call()))
  }

  setMaxSell = async () => {
    const poolAmountFromWei = await this.getFundBalance(this.props.fromAddress)
    this.setState({ poolAmount:poolAmountFromWei })

    if(Number(poolAmountFromWei) === 0)
      this.setState({
         ErrorText:"Your balance is empty"
      })
  }

  render() {
    return (
      <Form>
      <Form.Group>
       <Form.Label><small>Enter amount to sell</small> &nbsp;</Form.Label>
       <Button variant="outline-secondary" size="sm" onClick={() => this.setMaxSell()}>max</Button>
       <Form.Control
       value={this.state.poolAmount}
       type="number"
       min="1"
       onChange={(e) => this.setState({ poolAmount:e.target.value })}/>
     </Form.Group>
     {
       this.state.ErrorText.length > 0
       ?
       (
         <Alert variant="danger">{ this.state.ErrorText }</Alert>
       )
       :null
     }
     <Button variant="outline-primary" onClick={() => this.removeLiqudity()}>Sell</Button>
      </Form>
    )
  }

}

export default SellV2Pool

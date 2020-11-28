// for bancor type 2

import React, { PureComponent } from 'react'
import { Form, Button, Alert } from "react-bootstrap"
import setPending from '../../../../utils/setPending'

import {
  SmartFundABIV7,
  BancorConverterABI,
  BancorFormulaABI,
  GetBancorDataABI,
  GetBancorData,
  ERC20ABI,
  BancorConverterTypeTWOABI
} from '../../../../config.js'

import { toWei, fromWei } from 'web3-utils'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'



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
      try{
        const poolToken = await this.getPoolToken()
        const fundBalance = await this.getFundBalance(poolToken)
        if(fundBalance >= this.state.poolAmount){
          const connectorsAddress = await this.getConnectors(this.props.converterAddress)
          const reserveMinReturnAmounts = Array(connectorsAddress.length).fill(1)
          const smartFund = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)

          console.log(connectorsAddress, reserveMinReturnAmounts)

          // get gas price from local storage
          const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000
          const block = await this.props.web3.eth.getBlockNumber()

          // encode additional data in bytes
          // dependse of converterType
          const additionalData = this.props.web3.eth.abi.encodeParameters(
            ['address[]', 'uint256'],
            [connectorsAddress, 1]
          )


          // sell pool
          smartFund.methods.sellPool(
            toWei(String(this.state.poolAmount)),
            0, // type Bancor
            poolToken,
            [
              numStringToBytes32(String(this.props.converterVersion)),
              numStringToBytes32(String(this.props.converterType))
            ],
            additionalData
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
      }
      catch(e){
        alert('Can not verify transaction data, please try again in a minute')
      }
    }
    else{
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
    const GetBancorDataContract = new this.props.web3.eth.Contract(GetBancorDataABI, GetBancorData)
    const BancorFormulaAddress = await GetBancorDataContract.methods.getBancorContractAddresByName(
      "BancorFormula"
    ).call()
    const BancorFormula = new this.props.web3.eth.Contract(BancorFormulaABI, BancorFormulaAddress)
    console.log(BancorFormula)
  }

  getFundBalance = async (poolTokenAddress) => {
    const poolToken = new this.props.web3.eth.Contract(ERC20ABI, poolTokenAddress)
    const balance = await poolToken.methods.balanceOf(this.props.smartFundAddress).call()
    return balance ? fromWei(String(balance)) : 0
  }

  setMaxSell = async () => {
    const poolToken = await this.getPoolToken()
    const poolAmountFromWei = await this.getFundBalance(poolToken)

    this.setState({ poolAmount:poolAmountFromWei })

    if(Number(poolAmountFromWei) === 0)
      this.setState({
         ErrorText:"Your balance is empty"
      })
  }

  // helper for get pool token from pool container for Bancor type 2
  getPoolToken = async () => {
    const poolToken = await this.getPoolTokenFromContainer(this.props.fromAddress)
    return poolToken
  }

  // extract pool token from pool container
  // need only for type 2
  getPoolTokenFromContainer = async (poolContainer) => {
    if(poolContainer && this.props.tokenData){
      const tokenObj = this.props.tokenData.filter(obj => obj.smartTokenAddress === poolContainer)
      const converter = new this.props.web3.eth.Contract(BancorConverterTypeTWOABI, tokenObj[0].converterAddress)
      return await converter.methods.poolToken(tokenObj[0].tokenAddress).call()
    }else {
      return null
    }
  }

  render() {
    return (
      <Form>
      {
        this.props.version >= 7
        ?
        (
          <>
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
          </>
        )
        :
        (
          <Alert variant="warning">Sorry your curent fund version not support this pool token</Alert>
        )
      }

      </Form>
    )
  }

}

export default SellV2Pool

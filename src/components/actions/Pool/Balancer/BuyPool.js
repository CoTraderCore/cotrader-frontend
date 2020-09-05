import React, { PureComponent } from 'react'
import { Form, Button } from "react-bootstrap"
import Pending from '../../../templates/Spiners/Pending'
import {
  BalancerPoolABI,
  ERC20ABI,
  ERC20Bytes32ABI
} from '../../../../config.js'

import { isAddress, toWei } from 'web3-utils'

import {
  toWeiByDecimalsInput,
  // fromWeiByDecimalsInput
} from '../../../../utils/weiByDecimals'


class BuyPool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      poolAmount:0,
      poolAddress: undefined,
      poolTokens: [],
      isPending:false
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevState.poolAddress !== this.state.poolAddress)
      this.updatePoolInfo()
  }

  // Buy Balancer pool 
  buyBalancerPool = async () => {
    const connectorsAddress = this.state.poolTokens.map(item => item.address)
    const connectorsAmount = this.state.poolTokens.map(item => item.amount)
    const poolAmount = toWei(this.state.poolAmount)
  }

  // get info for all pool connectors by pool token address
  updatePoolInfo = async () => {
    if(isAddress(this.state.poolAddress)){
      try{
        this.setState({ isPending:true })

        const BPool = new this.props.web3.eth.Contract(
          BalancerPoolABI,
          this.state.poolAddress)

        const poolTokenAddresses = await BPool.methods.getCurrentTokens().call()
        const poolTokens = []

        for(let i = 0; i < poolTokenAddresses.length; i++){
          const symbolsAndDecimals = await this.getTokenSymbolAndDecimals(
            poolTokenAddresses[i]
          )

          poolTokens.push({ address:poolTokenAddresses[i], ...symbolsAndDecimals })
        }

        this.setState({ poolTokens, isPending:false })

      }catch(e){
        alert("Wrong BPool address")
        console.log("err: ", e)
      }
    }else{
      this.setState({ poolTokens:[] })
    }
  }

  // return object with symbol and decimals
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

  // find a certain connector by symbol and update amount
  updatePoolTokensAmount = (symbol, amount) => {
    const searchObj = this.state.poolTokens.filter((item) => {
    return item.symbol === symbol
    })
    // TODO: convert  to wei by decimals
    searchObj[0].amount = toWeiByDecimalsInput(searchObj[0].decimals, amount)
  }

  render() {
    return (
      <>
      <Form>
        <Form.Group>
        <Form.Label>Balancer pool address</Form.Label>
        <Form.Control
        type="string"
        placeholder="Enter Balancer pool address"
        onChange={(e) => this.setState({ poolAddress:e.target.value })}
        />

        <br/>

        <Form.Label>Amount of pool for buy</Form.Label>
        <Form.Control
        type="string"
        placeholder="Enter Balancer pool amount"
        onChange={(e) => this.setState({ poolAmount:e.target.value })}/>
        </Form.Group>

        <br/>

        {
          this.state.poolTokens.length > 0 && this.state.poolAmount > 0
          ?
          (
            <>
              {
                this.state.poolTokens.map((item, key) => {
                  return(
                    <Form.Group key={key}>
                    <Form.Label>max amount of { item.symbol }</Form.Label>
                    <Form.Control
                    type="string"
                    placeholder={`Enter ${ item.symbol }`}
                    name={ item.symbol }
                    onChange={(e) => this.updatePoolTokensAmount(e.target.name, e.target.value)}/>
                    </Form.Group>
                  )
                })
              }
              <Button variant="outline-primary" onClick={() => this.buyBalancerPool()}>Buy</Button>
            </>
          )
          :null
        }
      </Form>
      {
        this.state.isPending
        ?(<Pending/>)
        :null
      }
      </>
    )
  }

}

export default BuyPool

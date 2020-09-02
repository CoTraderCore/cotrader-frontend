import React, { PureComponent } from 'react'
import { Form } from "react-bootstrap"
import Pending from '../../../templates/Spiners/Pending'
import {
  BalancerPoolABI,
  ERC20ABI,
  ERC20Bytes32ABI
} from '../../../../config.js'

import {
  isAddress,
  // fromWei,
  // toWei
} from 'web3-utils'


class BuyPool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      poolAddress: undefined,
      poolTokens: [],
      isPending:false
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevState.poolAddress !== this.state.poolAddress)
      this.updatePoolInfo()
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
        </Form.Group>
        {
          this.state.poolTokens.length > 0
          ?
          (
            <>
              {
                this.state.poolTokens.map((item, key) => {
                  return(
                    <Form.Group key={key}>
                    <Form.Label>amount of { item.symbol }</Form.Label>
                    <Form.Control
                    type="string"
                    placeholder={`Enter ${ item.symbol }`}
                    />
                    </Form.Group>
                  )
                })
              }
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

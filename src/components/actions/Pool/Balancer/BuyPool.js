import React, { PureComponent } from 'react'
import { Form, Button } from "react-bootstrap"
import Pending from '../../../templates/Spiners/Pending'
import {
  BalancerPoolABI,
  ERC20ABI,
  SmartFundABIV7
} from '../../../../config.js'
import setPending from '../../../../utils/setPending'
import { isAddress, toWei } from 'web3-utils'
import BigNumber from 'bignumber.js'
import {
  toWeiByDecimalsInput,
  // fromWeiByDecimalsInput
} from '../../../../utils/weiByDecimals'
import getTokenSymbolAndDecimals from '../../../../utils/getTokenSymbolAndDecimals'

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
    const connectorsAmount = [] // this.state.poolTokens.map(item => item.amount)

    for(let i = 0; i < connectorsAddress.length; i++){
      const amount = await this.calculateMaxConnectorsAmount(connectorsAddress[i])
      // console.log("Amount ", fromWei(String(amount)))
      connectorsAmount.push(amount)
    }

    const poolAmount = toWei(this.state.poolAmount)

    const fundContract = new this.props.web3.eth.Contract(
      SmartFundABIV7,
      this.props.smartFundAddress
    )

    // get block number
    const block = await this.props.web3.eth.getBlockNumber()
    // get gas price from local storage
    const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

    // buy pool
    fundContract.methods.buyPool(
      poolAmount,
      2, // type Balancer
      this.state.poolAddress,
      connectorsAddress,
      connectorsAmount,
      [],
      "0x"
    )
    .send({ from: this.props.accounts[0], gasPrice })
    .on('transactionHash', (hash) => {
    // pending status for spiner
    this.props.pending(true)
    // pending status for DB
    setPending(this.props.smartFundAddress, 1, this.props.accounts[0], block, hash, "Trade")
    })
    // close pool modal
    this.props.modalClose()
  }


  // helper for get max connector amount for send to pool by pool amount
  // maxAmountsIn[token] = (poolAmountOut / totalPoolSupply) * tokenBalanceInsidePool * (1 + buffer),
  // where buffer can be e.g. 0% or 5%. the higher the buffer,
  // the less likely join will fail due to price changes
  calculateMaxConnectorsAmount = async (tokenAddress) => {
    const poolAmount = toWei(this.state.poolAmount)
    const poolToken = new this.props.web3.eth.Contract(ERC20ABI, this.state.poolAddress)
    const totalPoolSupply = await poolToken.methods.totalSupply().call()
    const connectorToken = new this.props.web3.eth.Contract(ERC20ABI, tokenAddress)
    const tokenBalanceInsidePool = await connectorToken.methods.balanceOf(this.state.poolAddress).call()

    const buffer = 1 + 0.5
    const result = BigNumber(poolAmount)
                   .dividedBy(totalPoolSupply)
                   .multipliedBy(tokenBalanceInsidePool)
                   .multipliedBy(buffer)
    return String(Math.trunc(result))
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
          const symbolsAndDecimals = await getTokenSymbolAndDecimals(
            poolTokenAddresses[i],
            this.props.web3
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
        <Button variant="outline-primary" onClick={() => this.buyBalancerPool()}>Buy</Button>
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

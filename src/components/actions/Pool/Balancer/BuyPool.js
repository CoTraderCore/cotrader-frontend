import React, { PureComponent } from 'react'
import { Form, Button, Alert, Table } from "react-bootstrap"
import Pending from '../../../templates/Spiners/Pending'
import {
  BalancerPoolABI,
  ERC20ABI,
  SmartFundABIV7
} from '../../../../config.js'
import setPending from '../../../../utils/setPending'
import { isAddress, toWei, fromWei } from 'web3-utils'
import BigNumber from 'bignumber.js'

import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'

import getTokenSymbolAndDecimals from '../../../../utils/getTokenSymbolAndDecimals'

class BuyPool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      poolAmount:0,
      poolAddress: undefined,
      poolTokens: [],
      isPending:false,
      totalPoolSupply:0,
      fundCurrentPoolShare:0,
      fundNewPoolShare:0,
      fundTotalNewShare:0
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevState.poolAddress !== this.state.poolAddress || prevState.poolAmount !== this.state.poolAmount)
      this.updatePoolInfo()
  }

  // Buy Balancer pool
  buyBalancerPool = async () => {
    try{
      const connectorsAddress = this.state.poolTokens.map(item => item.address)
      const connectorsAmount = this.state.poolTokens.map(item => item.amount)
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
    catch(e){
      alert('Can not verify transaction data, please try again in a minute')
    }
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
    return BigNumber(BigNumber(result).integerValue()).toString(10)
  }

  // get info by pool token address and amount
  updatePoolInfo = async () => {
    if(isAddress(this.state.poolAddress) && this.state.poolAmount > 0){
      this.setState({ isPending:true })

      try{
        // get pool instance
        const BPool = new this.props.web3.eth.Contract(
          BalancerPoolABI,
          this.state.poolAddress)

        // get data for all pool connectors
        const poolTokenAddresses = await BPool.methods.getCurrentTokens().call()
        const poolTokens = []

        // loop and parse all connectors
        for(let i = 0; i < poolTokenAddresses.length; i++){
          const { symbol, decimals } = await getTokenSymbolAndDecimals(
            poolTokenAddresses[i],
            this.props.web3
          )

          const amount = await this.calculateMaxConnectorsAmount(poolTokenAddresses[i])
          const amountFromWei = fromWeiByDecimalsInput(decimals, amount)

          poolTokens.push({
            address:poolTokenAddresses[i],
            amountFromWei,
            amount,
            symbol,
            decimals
          })
        }

        // get pool share info
        const totalPoolSupply = fromWei(String(await BPool.methods.totalSupply().call()))
        const curFundPoolBalance = fromWei(String(await BPool.methods.balanceOf(this.props.smartFundAddress).call()))
        // get current shares
        const fundCurrentPoolShare = 1 / ((parseFloat(totalPoolSupply) / 100) / parseFloat(curFundPoolBalance))
        // get receive share
        const poolOnePercent = (parseFloat(totalPoolSupply) + parseFloat(this.state.poolAmount)) / 100
        const fundNewPoolShare = 1 / (poolOnePercent / parseFloat(this.state.poolAmount))
        const fundTotalNewShare = fundCurrentPoolShare + fundNewPoolShare

        // update states
        this.setState({
          poolTokens,
          totalPoolSupply,
          fundCurrentPoolShare,
          fundNewPoolShare,
          fundTotalNewShare,
          isPending:false
        })
      }
      catch(e){
        alert("Wrong BPool address")
        console.log("err: ", e)
      }
    }
    else{
      this.setState({ poolTokens:[], isPending:false })
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
        {
          this.state.poolTokens.length > 0 && this.state.poolAmount > 0
          ?
          (
            <Button variant="outline-primary" onClick={() => this.buyBalancerPool()}>Buy</Button>
          )
          :null
        }
      </Form>

      <br/>

      { /* Show pool share info */
        this.state.fundNewPoolShare > 0 && this.state.poolAmount > 0
        ?
        (
          <>
          <small>
          <Table striped bordered hover size="sm">
          <thead>
           <tr>
             <th>You will get</th>
           </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pool amount</td>
              <td>
              {this.state.poolAmount}
              &#160;, current total supply &#160;
              {parseFloat(this.state.totalPoolSupply).toFixed(4)}
              </td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share now</td>
              <td>{parseFloat(this.state.fundCurrentPoolShare).toFixed(4)} %</td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share gain</td>
              <td>{parseFloat(this.state.fundNewPoolShare).toFixed(4)} % </td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share new</td>
              <td>{parseFloat(this.state.fundTotalNewShare).toFixed(4)} % </td>
            </tr>
          </tbody>
          </Table>
          </small>
          </>
        ):null
      }

      <br/>

      { /* Show connectors additional info */
        this.state.poolTokens.length > 0
        ?
        (
          <Alert variant="warning">
          <div align="center">Max amount to send</div>
          <br/>
          {
            this.state.poolTokens.map((item, key) => {
              return (
                <div key={key}>
                <hr/>
                <strong>
                &ensp; {item.symbol} &ensp; : &ensp; {item.amountFromWei} &ensp;
                </strong>
                </div>
              )
            })
          }
          </Alert>
        ):null
      }

      { /* Show spinner */
        this.state.isPending
        ?(<Pending/>)
        :null
      }
      </>
    )
  }

}

export default BuyPool

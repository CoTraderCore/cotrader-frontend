import React, { PureComponent } from 'react'
import { Typeahead } from 'react-bootstrap-typeahead'
import {
  isAddress,
  fromWei
} from 'web3-utils'
import { Form, Button, Alert, Table } from "react-bootstrap"
import { toWeiByDecimalsDetect, fromWeiByDecimalsDetect } from '../../../../utils/weiByDecimals'
import {
  IUniswapV2FactoryABI,
  UniswapV2Factory,
  SmartFundABIV7,
  ERC20ABI,
  UniWTH,
  IUniswapV2PairABI,
  UniswapV2Router02,
  UniswapV2Router02ABI
} from '../../../../config.js'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'
import setPending from '../../../../utils/setPending'
import BigNumber from 'bignumber.js'
import Pending from '../../../templates/Spiners/Pending'

const ETH_TOKEN_ADDRESS = String('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE').toLowerCase()


class BuyV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      secondConnector:'',
      firstConnectorAmount:0,
      secondConnectorAmount:0,
      secondConnectorSymbol:'',
      connectors:[],
      connectorsAmount:[],
      poolTokenAddress:[],
      poolTotalSupply:0,
      poolAmountGet:0,
      fundCurrentPoolSharePercent:0,
      fundRecievePoolSharePercent:0,
      fundNewPoolSharePercent:0,
      showPending:false,
      ErrorText:'',
      latestBlockNumber:0,
      intervalID:0
    }
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.tokenAddress !== this.props.tokenAddress || prevState.secondConnector !== this.state.secondConnector){
      this.clearIntervalUpdateByEachNewBlock()
      // reset states
      this.setState({
        firstConnectorAmount:0,
        secondConnectorAmount:0
       })
    }
  }

  componentWillUnmount(){
    this.clearIntervalUpdateByEachNewBlock()
  }

  // Buy pool
  addLiquidity = async () => {
    // get UNI pool contract by token address form Uniswap factory
    const poolTokenAddress = this.state.poolTokenAddress

    // Continue only if such pool exist
    if(poolTokenAddress !== "0x0000000000000000000000000000000000000000"){
      try{
        // get smart fund contract instance
        const fundContract = new this.props.web3.eth.Contract(
          SmartFundABIV7,
          this.props.smartFundAddress
        )

        // prepare pool path
        // WARNING
        // ETH case should be in [0] index
        // because we detect ETH by [0] on contract Uniswap method side
        const connectorsOriginalAddresses = [this.props.tokenAddress, this.state.secondConnector]
        const connectors = String(this.state.secondConnector).toLowerCase() === ETH_TOKEN_ADDRESS
        ? connectorsOriginalAddresses.reverse()
        : connectorsOriginalAddresses

        const connectorsAmount = String(this.state.secondConnector).toLowerCase() === ETH_TOKEN_ADDRESS
        ? this.state.connectorsAmount.reverse()
        : this.state.connectorsAmount

        // compare fund balance
        const isEnoughBalance = await this.compareFundBalance(
          connectors,
          connectorsAmount
        )

        console.log(
          "Pool PARAMS",
          0, // for v2 we calculate pool amount by connctors
          1, // type Uniswap
          poolTokenAddress,
          connectors,
          connectorsAmount,
          [numStringToBytes32(String(2))], // version 2
          this.props.web3.eth.abi.encodeParameters(
            ['uint256','uint256'],
            [1,1]
          )
        )

        // continue only if enough balance
        if(isEnoughBalance){
          // get block number
          const block = await this.props.web3.eth.getBlockNumber()
          // get gas price from local storage
          const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000
          // buy pool
          fundContract.methods.buyPool(
            0, // for v2 we calculate pool amount by connctors
            1, // type Uniswap
            poolTokenAddress,
            connectors,
            connectorsAmount,
            [numStringToBytes32(String(2))], // version 2
            this.props.web3.eth.abi.encodeParameters(
              ['uint256','uint256'],
              [1,1]
            ) // additional data should be min return
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
        else{
          this.setState({ ErrorText: "insufficient balance" })
        }
      }
      catch(e){
        alert('Can not verify transaction data, please try again in a minute')
      }
    }
    else{
      this.setState({ ErrorText: "Such pool not exist" })
    }
  }

  // update state only when user stop typing
  delayChange(evt, isFirstConnector, _amount) {
    //if there is already a timeout in process cancel it
    if(this._timeout){
        clearTimeout(this._timeout)
    }
    // reset update by each new block interval
    this.clearIntervalUpdateByEachNewBlock()

    // update input immediately
    this.setState({
      [evt.target.name]:evt.target.value
    })

    // compute and update new data with delay
    this._timeout = setTimeout(()=>{
       this._timeout = null
       this.updateConnectorByConnector(isFirstConnector, _amount)
    }, 300)
  }

  // update amount of connector 0 by amount of connector 1
  // and vice versa
  updateConnectorByConnector = async (isFirstConnector, _amount) => {
    try{
      // for avoid e+ or e- scientific notation
      const amount = BigNumber(_amount).toPrecision()
      if(amount > 0){
        // set pending
        this.setState({ showPending:true })

        const {
          tokenAWrap,
          tokenBWrap,
          poolTokenAddress
        } = await this.getPoolDirection()



        const router = new this.props.web3.eth.Contract(UniswapV2Router02ABI, UniswapV2Router02)
        const pair = new this.props.web3.eth.Contract(IUniswapV2PairABI, poolTokenAddress)

        const fromAddress = isFirstConnector ? tokenAWrap : tokenBWrap
        const toAddress = isFirstConnector ? tokenBWrap : tokenAWrap
        const fromAmount = await toWeiByDecimalsDetect(fromAddress, amount, this.props.web3)
        const token0 =  await pair.methods.token0.call()

        // get rate of to by from
        const reservesData = await pair.methods.getReserves().call()

        // get corerct path dependse of input direction
        const path = String(token0).toLowerCase() === String(fromAddress).toLowerCase()
        ? [reservesData[0], reservesData[1]]
        : [reservesData[1], reservesData[0]]

        // get rate
        const toAmount = await router.methods.quote(fromAmount, ...path).call()
        const toFromWei = await fromWeiByDecimalsDetect(toAddress, toAmount, this.props.web3)

        const connectorsAmount = [
          BigNumber(BigNumber(fromAmount).integerValue()).toString(10),
          BigNumber(BigNumber(toAmount).integerValue()).toString(10)
        ]

        const latestBlockNumber = await this.props.web3.eth.getBlockNumber()

        // update states dependse of input direction
        if(isFirstConnector){
          this.setState({
            secondConnectorAmount:toFromWei,
            firstConnectorAmount:amount,
            connectorsAmount,
            latestBlockNumber
          })
        }else{
          this.setState({
            firstConnectorAmount:toFromWei,
            secondConnectorAmount:amount,
            connectorsAmount,
            latestBlockNumber
          })
        }
        //
        // update info
        await this.updateInfoByOnChange(isFirstConnector)
        // run update by each new block
        await this.setIntervalUpdateByEachNewBlock(isFirstConnector, _amount)
      }
    }catch(e){
      this.setState({ showPending:false })
      alert("such pool pair not exist, or try another amount")
      console.log("Error", e)
    }
  }

  // call updateConnectorByConnector each new block
  setIntervalUpdateByEachNewBlock = async (isFirstConnector, _amount) => {
    const currentBlockNumber = await this.props.web3.eth.getBlockNumber()
    console.log("cur block", currentBlockNumber)

    if(currentBlockNumber !== this.state.latestBlockNumber){
      await this.updateConnectorByConnector(isFirstConnector, _amount)
      this.setState({ latestBlockNumber:currentBlockNumber })
      console.log("new block", currentBlockNumber)
    }

    clearTimeout(this.state.intervalID) // clear prev interval
    // set new
    const intervalID = setTimeout(this.setIntervalUpdateByEachNewBlock, 4000, isFirstConnector, _amount)
    this.setState({ intervalID })

  }

  // clear setIntervalUpdateByEachNewBlock
  clearIntervalUpdateByEachNewBlock(){
    if(this.state.intervalID !== 0){
      clearTimeout(this.state.intervalID)
      this.setState({ intervalID:0 })
    }
  }

  // update states by onChange
  updateInfoByOnChange = async (isFirstConnector) => {
    if(isAddress(this.props.tokenAddress) && isAddress(this.state.secondConnector)){
      // get data
      const {
        poolTokenAddress
      } = await this.getPoolDirection()

      const {
        poolTotalSupply,
        poolAmountGet,
        fundCurrentPoolSharePercent,
        fundRecievePoolSharePercent,
        fundNewPoolSharePercent
      } = await this.calculatePoolShare(poolTokenAddress, this.state.connectorsAmount, isFirstConnector)

      // Update states
      this.setState({
        poolTokenAddress,
        poolTotalSupply,
        poolAmountGet,
        fundCurrentPoolSharePercent,
        fundRecievePoolSharePercent,
        fundNewPoolSharePercent,
        showPending:false
      })
    }
  }

  // helper for get pool address and wrap connectors for ETH case
  getPoolDirection = async () => {
    // get Uniswap factory instance
    const uniswapFactory = new this.props.web3.eth.Contract(
      IUniswapV2FactoryABI,
      UniswapV2Factory)

    const tokenA = this.props.tokenAddress
    const tokenB = this.state.secondConnector

    // Wrap ETH case with UNI WETH
    const tokenAWrap = String(tokenA).toLowerCase() === String(ETH_TOKEN_ADDRESS).toLowerCase()
    ? UniWTH
    : tokenA

    const tokenBWrap = String(tokenB).toLowerCase() === String(ETH_TOKEN_ADDRESS).toLowerCase()
    ? UniWTH
    : tokenB

    // get UNI pool contract by token address form Uniswap factory
    const poolTokenAddress = await uniswapFactory.methods.getPair(
      tokenAWrap,
      tokenBWrap
    ).call()

    return { tokenAWrap, tokenBWrap, poolTokenAddress }
  }


  // helper for calculate user pool share by connectors input
  // return poolTotalSupply, poolAmountGet, fundCurrentPoolSharePercent,
  // fundRecievePoolSharePercent, fundNewPoolSharePercent
  calculatePoolShare = async (poolAddress, connectorsAmount, isFirstConnector) => {
    const UniPair = new this.props.web3.eth.Contract(IUniswapV2PairABI, poolAddress)
    const Reserves = await UniPair.methods.getReserves().call()
    const amount0 = isFirstConnector ? connectorsAmount[1] : connectorsAmount[0]
    const amount1 = isFirstConnector ? connectorsAmount[0] : connectorsAmount[1]
    const poolToken = this.props.web3.eth.Contract(ERC20ABI, poolAddress)
    const totalSupply = await poolToken.methods.totalSupply().call()

    let liquidityAmount = 0

    if(fromWei(String(totalSupply)) === 0){
      const MINIMUM_LIQUIDITY = 10**3
      liquidityAmount = Math.sqrt(BigNumber(amount0).multipliedBy(amount1).minus(MINIMUM_LIQUIDITY))
    }
    else{
      liquidityAmount = Math.min(
        BigNumber(amount0).multipliedBy(totalSupply).dividedBy(Reserves[0]),
        BigNumber(amount1).multipliedBy(totalSupply).dividedBy(Reserves[1])
      )
    }

    // calculate shares
    const poolTotalSupply = fromWei(String(totalSupply))
    const poolAmountGet = fromWei((Math.floor(liquidityAmount)).toLocaleString('fullwide', {useGrouping:false}) )
    // get current shares in %
    const curPoolBalance = await poolToken.methods.balanceOf(this.props.smartFundAddress).call()
    const fundCurrentPoolSharePercent = 1 / ((parseFloat(poolTotalSupply) / 100)
    / parseFloat(fromWei(String(curPoolBalance))))

    // get received shares in %
    const poolOnePercent = (parseFloat(poolTotalSupply) + parseFloat(poolAmountGet)) / 100
    const fundRecievePoolSharePercent = 1 / (poolOnePercent / parseFloat(poolAmountGet))

    // get new shares
    const fundNewPoolSharePercent = fundCurrentPoolSharePercent + fundRecievePoolSharePercent

    // return result
    return {
      poolTotalSupply,
      poolAmountGet,
      fundCurrentPoolSharePercent,
      fundRecievePoolSharePercent,
      fundNewPoolSharePercent
    }
  }

  // return false if fund don't have enough balance for cur connetors input
  // TODO wrap ETH with WETH
  compareFundBalance = async (connectorsAddress, connetorsInputInWEI) => {
    let isEnough = true
    let balance = 0
    for(let i = 0; i < connectorsAddress.length; i++){
      // ETH case
      if(String(connectorsAddress[i]).toLowerCase() === ETH_TOKEN_ADDRESS){
        balance = await this.props.web3.eth.getBalance(this.props.smartFundAddress)
      }
      // ERC20 case
      else{
        // get cur token instance
        const token = new this.props.web3.eth.Contract(
          ERC20ABI,
          connectorsAddress[i]
        )
        // get fund balance of cur token
        balance = await token.methods.balanceOf(
          this.props.smartFundAddress
        ).call()
      }

      if(Number(fromWei(String(connetorsInputInWEI[i]))) > Number(fromWei(String(balance))))
         isEnough = false
    }
    return isEnough
  }


  render() {
    return (
      <>
      { /* Select second connector symbol */ }
      <Typeahead
        labelKey="uniswapSymbolsTwo"
        multiple={false}
        id="uniswapSymbolsTwo"
        options={this.props.symbols}
        onChange={(s) => this.setState({
          secondConnector: this.props.findAddressBySymbol(s[0]),
          secondConnectorSymbol:s[0]
          })}
        placeholder="Choose a second connector symbol"
        renderMenuItemChildren={(options, props) => (
          <div>
            <img style={{height: "35px", width: "35px"}}src={`https://tokens.1inch.exchange/${this.props.findAddressBySymbol(options)}.png`} alt="Logo" />
            &nbsp; &nbsp;
            {options}
          </div>
        )}
      />

      { /* If addresses correct, show input form */ }
      <br/>
      {
        isAddress(this.state.secondConnector) && isAddress(this.props.tokenAddress)
        ?
        (
          <Form>
          <Form.Group>
          <Form.Control
          type="number"
          name="firstConnectorAmount"
          value={this.state.firstConnectorAmount}
          onChange={(e) => this.delayChange(e, true, e.target.value)}
          placeholder={`Enter ${this.props.selectedSymbol} amount`}
          />
          </Form.Group>
          <Form.Group>
          <Form.Control
          type="number"
          name="secondConnectorAmount"
          value={this.state.secondConnectorAmount}
          onChange={(e) => this.delayChange(e, false, e.target.value)}
          placeholder={`Enter ${this.state.secondConnectorSymbol} amount`}
          />
          </Form.Group>
          <br/>
          <Button
          variant="outline-primary"
          type="button"
          onClick={() => this.addLiquidity()}
          >
          Buy
          </Button>
          </Form>
        )
        :null
      }

      { /* Show spinner */
        this.state.showPending
        ?
        (
          <Pending/>
        ):null
      }

      { /* Show pool share info */
        this.state.poolAmountGet > 0
        ?
        (
          <>
          <br/>
          <small>
          <Table striped bordered hover size="sm">
          <thead>
           <tr>
             <th>You will get</th>
           </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pool tokens</td>
              <td>
              {Number(this.state.poolAmountGet).toFixed(4)}
              &#160;, current total supply &#160;
              {Number(this.state.poolTotalSupply).toFixed(4)}
              </td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share now</td>
              <td>{Number(this.state.fundCurrentPoolSharePercent).toFixed(4)} %</td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share gain</td>
              <td>{Number(this.state.fundRecievePoolSharePercent).toFixed(4)} %</td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td>Share new</td>
              <td>{Number(this.state.fundNewPoolSharePercent).toFixed(4)} %</td>
            </tr>
          </tbody>
          </Table>
          </small>
          </>
        ):null

      }

      { /* Show error msg */
        this.state.ErrorText.length > 0
        ?
        (
          <Alert variant="danger">{ this.state.ErrorText }</Alert>
        )
        :null
      }
      </>
    )
  }

}

export default BuyV2Pool

import React, { PureComponent } from 'react'
import { Typeahead } from 'react-bootstrap-typeahead'
import {
  isAddress,
  // fromWei,
  toWei
} from 'web3-utils'
import { Form, Button, Alert } from "react-bootstrap"
import { fromWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import {
  IUniswapV2FactoryABI,
  UniswapV2Factory,
  SmartFundABIV7,
  UniWTH,
  PoolPortalABI,
  PoolPortalV7
} from '../../../../config.js'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'
import setPending from '../../../../utils/setPending'
import getTokenSymbolAndDecimals from '../../../../utils/getTokenSymbolAndDecimals'
import Pending from '../../../templates/Spiners/Pending'

const ETH_TOKEN_ADDRESS = String('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE').toLowerCase()


class SellV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      secondConnector:undefined,
      poolAmount:0,
      poolTokenAddress:undefined,
      tokenAmountFromWei0:0,
      tokenAmountFromWei1:0,
      tokenSymbol0:'',
      tokenSymbol1:'',
      showPending:false,
      ErrorText:''
    }
  }

  componentDidUpdate = async (prevProps, prevState) => {
    if(prevProps.tokenAddress !== this.props.tokenAddress
       ||
       prevState.secondConnector !== this.state.secondConnector
       ||
       prevState.poolAmount !== this.state.poolAmount)
    {
       this.updateInfoByOnchange()
    }
  }

  // Buy pool
  removeLiquidity = async () => {
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

        // get block number
        const block = await this.props.web3.eth.getBlockNumber()
        // get gas price from local storage
        const gasPrice = localStorage.getItem('gasPrice') ? localStorage.getItem('gasPrice') : 2000000000

        // buy pool
        fundContract.methods.sellPool(
          toWei(this.state.poolAmount),
          1, // type Uniswap
          poolTokenAddress,
          [numStringToBytes32(String(2))], // version 2
          this.props.web3.eth.abi.encodeParameters(
            ['address[]','uint256','uint256'],
            [connectors,1,1]
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
      catch(e){
        alert('Can not verify transaction data, please try again in a minute')
      }
    }
    else{
      this.setState({ ErrorText: "Such pool not exist" })
    }
  }

  // Update states by onchange
  updateInfoByOnchange = async () => {
    if(isAddress(this.props.tokenAddress)
       &&
       isAddress(this.state.secondConnector)
       &&
       this.state.poolAmount > 0)
    {
      try{
        this.setState({ showPending:true })
        // Get data
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

        // Get connectors info
        const {
          tokenAmountFromWei0,
          tokenSymbol0,
          tokenAmountFromWei1,
          tokenSymbol1
        } = await this.getConnectorsAmountByPoolAmount(
          toWei(this.state.poolAmount),
          poolTokenAddress
        )

        // Update states
        this.setState({
          poolTokenAddress,
          tokenAmountFromWei0,
          tokenSymbol0,
          tokenAmountFromWei1,
          tokenSymbol1,
          showPending:false
        })
      }catch(e){
        alert("Pool pair not exist")
        console.log(e)
      }
    }
  }


  getConnectorsAmountByPoolAmount = async (poolAmount, poolToken) => {
    const poolPortal = new this.props.web3.eth.Contract(PoolPortalABI, PoolPortalV7)
    const data = await poolPortal.methods.getUniswapV2ConnectorsAmountByPoolAmount(
      poolAmount,
      poolToken
    ).call()

    const tokenAmount0 = data[0]
    const tokenAmount1 = data[1]

    const tokenAddress0 = data[2]
    const tokenAddress1 = data[3]

    const {
      symbol:tokenSymbol0,
      decimals:decimals0
    } = await getTokenSymbolAndDecimals(tokenAddress0, this.props.web3)
    const tokenAmountFromWei0 = fromWeiByDecimalsInput(decimals0, tokenAmount0)


    const {
      symbol:tokenSymbol1,
      decimals:decimals1
    } = await getTokenSymbolAndDecimals(tokenAddress1, this.props.web3)
    const tokenAmountFromWei1 = fromWeiByDecimalsInput(decimals1, tokenAmount1)

    return { tokenAmountFromWei0, tokenSymbol0, tokenAmountFromWei1, tokenSymbol1 }
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
        onChange={(s) => this.setState({secondConnector: this.props.findAddressBySymbol(s[0])})}
        placeholder="Choose a second connector symbol"
        renderMenuItemChildren={(options, props) => (
          <div>
            <img style={{height: "35px", width: "35px"}}src={`http://1inch.exchange/assets/tokens/${this.props.findAddressBySymbol(options)}.png`} alt="Logo" />
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
          min="0"
          onChange={(e) => this.setState({ poolAmount:e.target.value })}
          placeholder={`Enter pool amount`}
          />
          </Form.Group>
          <br/>
          <Button
          variant="outline-primary"
          type="button"
          onClick={() => this.removeLiquidity()}
          >
          Sell
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

      { /* Show recieve info */
        this.state.tokenAmountFromWei0 > 0 && this.state.tokenAmountFromWei1 > 0
        ?
        (
          <Alert variant="success">
          You will get:
          <hr/>
          {this.state.tokenSymbol0} - {this.state.tokenAmountFromWei0}
          <hr/>
          {this.state.tokenSymbol1} - {this.state.tokenAmountFromWei1}
          </Alert>
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

export default SellV2Pool

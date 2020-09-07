import React, { PureComponent } from 'react'
import { Typeahead } from 'react-bootstrap-typeahead'
import {
  isAddress,
  // fromWei,
  toWei
} from 'web3-utils'
import { Form, Button, Alert } from "react-bootstrap"
// import { toWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import {
  IUniswapV2FactoryABI,
  UniswapV2Factory,
  SmartFundABIV7,
  UniWTH
} from '../../../../config.js'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'
import setPending from '../../../../utils/setPending'

const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'


class SellV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      secondConnector:'',
      poolAmount:0,
      ErrorText:''
    }
  }

  // Buy pool
  removeLiquidity = async () => {
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

    // Continue only if such pool exist
    if(poolTokenAddress !== "0x0000000000000000000000000000000000000000"){
      // get smart fund contract instance
      const fundContract = new this.props.web3.eth.Contract(
        SmartFundABIV7,
        this.props.smartFundAddress
      )

      // second connector (ETH) should be in [0] index
      const connectors = [this.state.secondConnector, this.props.tokenAddress]

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
    else{
      this.setState({ ErrorText: "Such pool not exist" })
    }
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

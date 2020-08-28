import React, { PureComponent } from 'react'
import { Typeahead } from 'react-bootstrap-typeahead'
import {
  isAddress,
  // fromWei, 
  toWei
} from 'web3-utils'
import { Form, Button, Alert } from "react-bootstrap"
import { toWeiByDecimalsInput } from '../../../../utils/weiByDecimals'
import {
  IUniswapV2FactoryABI,
  UniswapV2Factory,
  SmartFundABIV7,
  ERC20ABI,
  UniWTH
} from '../../../../config.js'
import { numStringToBytes32 } from '../../../../utils/numberToFromBytes32'
import setPending from '../../../../utils/setPending'

const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'



class BuyV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      secondConnector:'',
      firstConnectorAmount:0,
      secondConnectorAmount:0,
      secondConnectorSymbol:'',
      ErrorText:''
    }
  }

  // Buy pool
  addLiquidity = async () => {
    // get Uniswap factory instance
    const uniswapFactory = new this.props.web3.eth.Contract(
      IUniswapV2FactoryABI,
      UniswapV2Factory)

    // Wrap ETH case
    const tokenA = String(this.props.tokenAddress).toLowerCase() === String(ETH_TOKEN_ADDRESS).toLowerCase()
    ? UniWTH
    : this.props.tokenAddress

    const tokenB = String(this.state.secondConnector).toLowerCase() === String(ETH_TOKEN_ADDRESS).toLowerCase()
    ? UniWTH
    : this.state.secondConnector

    // get UNI pool contract by token address form Uniswap factory
    const poolTokenAddress = await uniswapFactory.methods.getPair(
      tokenA,
      tokenB
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
      const connetorsInput = [this.state.secondConnectorAmount, this.state.firstConnectorAmount]
      // convert connetors amount to wei by decimals
      const connectorsAmount = await this.convertPoolConnecorsToWeiByDecimals(
        connectors,
        connetorsInput
      )

      // compare fund balance
      const isEnoughBalance = await this.compareFundBalance(
        connectors,
        connectorsAmount
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
        this.setState({ ErrorText: "You do not have enough assets in the fund for this operation" })
      }
    }
    else{
      this.setState({ ErrorText: "Such pool not exist" })
    }
  }

  // convert input connetors tokens in wei by decimals
  convertPoolConnecorsToWeiByDecimals = async (connectorsAddress, connecorsInput) => {
    const connectorInWEI = []

    for(let i = 0; i < connectorsAddress.length; i++){
      let amount = 0
      // ERC20 case
      if(String(connectorsAddress[i]).toLowerCase() !== String(ETH_TOKEN_ADDRESS).toLowerCase()){
        // get cur token instance
        const token = new this.props.web3.eth.Contract(
          ERC20ABI,
          connectorsAddress[i]
        )
        // get cur amount in wei by decimals
        amount = toWeiByDecimalsInput(
        await token.methods.decimals().call(),
        connecorsInput[i]
        )
      }
      // ETH case
      else{
        amount = toWei(connecorsInput[i])
      }
      // push amount
      connectorInWEI.push(amount)
    }

    return connectorInWEI
  }

  // return false if fund don't have enough balance for cur connetors input
  compareFundBalance = async (connectorsAddress, connetorsInputInWEI) => {
    // let isEnough = true
    // for(let i = 0; i < connectorsAddress.length; i++){
    //   // get cur token instance
    //   const token = new this.props.web3.eth.Contract(
    //     ERC20ABI,
    //     connectorsAddress[i]
    //   )
    //   // get fund balance
    //   const fundBalance = await token.methods.balanceOf(
    //     this.props.smartFundAddress
    //   ).call()
    //
    //   if(Number(fromWei(String(connetorsInputInWEI[i]))) > Number(fromWei(String(fundBalance))))
    //      isEnough = false
    // }
    return true
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
          onChange={(e) => this.setState({ firstConnectorAmount:e.target.value })}
          placeholder={`Enter ${this.props.selectedSymbol} amount`}
          />
          </Form.Group>
          <Form.Group>
          <Form.Control
          type="number"
          min="0"
          onChange={(e) => this.setState({ secondConnectorAmount:e.target.value })}
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

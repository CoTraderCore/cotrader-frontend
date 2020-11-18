import React, { Component } from 'react'
import BuyPool from './BuyPool'
import BuyV2Pool from './BuyV2Pool'
import SellPool from './SellPool'
import SellV2Pool from './SellV2Pool'
import { Form } from "react-bootstrap"
import { Typeahead } from 'react-bootstrap-typeahead'
import { NeworkID, OneInchApi } from '../../../../config.js'
import axios from 'axios'

const getComponentList = (poolVersion) => {
  return(
    {
      Buy: poolVersion === 'version 2' ? BuyV2Pool : BuyPool,
      Sell: poolVersion === 'version 2' ? SellV2Pool : SellPool
    }
  )
}

class UniswapPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      action: 'Buy',
      symbols: [],
      tokens: [],
      tokenAddress: '',
      poolVersion:'version 2',
      selectedSymbol:''
    }
  }

  componentDidMount(){
    this.initData()
  }


  // get tokens addresses and symbols from paraswap api
  initData = async () => {
    let tokens = []
    let symbols = []
    const blackListPool = ["OMG", "ELF"]

    if(NeworkID === 1){
      // get data from Paraswap api
      try{
        let data = await axios.get(OneInchApi + 'tokens')
        for (const [, value] of Object.entries(data.data)) {
          symbols.push(value.symbol)
          tokens.push({
            symbol:value.symbol,
            address:value.address,
            decimals:value.decimals
          })
        }
         // filter black listed pool
         symbols = symbols.filter((item) => !blackListPool.includes(item))
       }catch(e){
         alert("Can not get data from api, please try again latter")
         console.log(e)
      }
    }
    else if(NeworkID === 3){
       // test data for Ropsten
       symbols = ['NAP', 'ETH']
       tokens = [
         {symbol:'NAP', address:'0x2f5cc2e9353feb3cbe32d3ab1ded9e469fad88c4'},
         {symbol:'ETH', address:'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'}
       ]
    }
    else if (NeworkID === 4){
      // test data for Rinkeby
      symbols = ['XXX', 'YYY', 'ETH', 'BNT']
      tokens = [
        {symbol:'XXX', address:'0x420b89636F9C932C8ab3524483A0AeEc112f3Dbe'},
        {symbol:'YYY', address:'0x7050C8C5f673bF36637c35c135B47F10593B206C'},
        {symbol:'ETH', address:'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'},
        {symbol:'BNT', address:'0x850f56419c669d7363756280f01daC254c0185F3'}
      ]
    }
    else {
      alert("Unknow network for UNI pool tokens")
    }

    this.setState({ tokens, symbols })
  }

  findAddressBySymbol = (symbol) => {
    const tokenObj = this.state.tokens.find((item) => item.symbol && item.symbol === symbol)
    if(tokenObj){
      return String(tokenObj.address).toLowerCase()
    }else{
      return null
    }
  }

  render() {
    // Change component (Buy or Sell)
    let CurrentAction
    const componentList = getComponentList(this.state.poolVersion)

    if(this.state.action in componentList){
      CurrentAction = componentList[this.state.action]
    }else{
      // alert('Wrong name for component action')
      CurrentAction = componentList['Buy']
    }
    return (
      <React.Fragment>
      {
        this.props.version >= 5
        ?
        (
          <React.Fragment>
          <Form>
          { /*
              This option available only for version 7 and newest
              And open for admin for test
            */
            this.props.version >= 7 || this.props.accounts[0] === '0x5cF7699636895dC71ae37d9733cBf7100Ef3DC50'
            ?
            (
              <Form.Group>
              <Form.Label>Selet Uniswap pool version</Form.Label>
              <Form.Control
                as="select"
                size="sm"
                name="selectPoolVersion"
                onChange={(e) => this.setState({ poolVersion:e.target.value})}
              >
                <option>version 2</option>
                <option>version 1</option>
              </Form.Control>
              </Form.Group>
            ):null
          }
            <Form.Group>
            <Form.Label>Selet action for Uniswap pool</Form.Label>
            <Form.Control
              as="select"
              size="sm"
              name="selectAction"
              onChange={(e) => this.setState({ action:e.target.value })}>
              {/* NOTE: render of actions components dependse of this actions*/}
              <option>Buy</option>
              <option>Sell</option>
              </Form.Control>
              </Form.Group>
             </Form>

             <Typeahead
               labelKey="uniswapSymbols"
               multiple={false}
               id="uniswapSymbols"
               options={this.state.symbols}
               onChange={(s) => this.setState({
                 tokenAddress: this.findAddressBySymbol(s[0]),
                 selectedSymbol:s[0]
               })}
               placeholder="Choose a symbol"
               renderMenuItemChildren={(options, props) => (
                 <div>
                   <img style={{height: "35px", width: "35px"}}src={`https://tokens.1inch.exchange/${this.findAddressBySymbol(options)}.png`} alt="Logo" />
                   &nbsp; &nbsp;
                   {options}
                 </div>
               )}
             />
             <br/>
             {/* Render current action */}
             <CurrentAction
               tokenAddress={this.state.tokenAddress}
               web3={this.props.web3}
               accounts={this.props.accounts}
               smartFundAddress={this.props.smartFundAddress}
               pending={this.props.pending}
               modalClose={this.props.modalClose}
               version={this.props.version}
               symbols={this.state.symbols}
               findAddressBySymbol={this.findAddressBySymbol}
               selectedSymbol={this.state.selectedSymbol}
             />
          </React.Fragment>
        )
        :
        (
          <p>Your version of fund not supported Uniswap pool</p>
        )
      }

      </React.Fragment>
    )
  }

}

export default UniswapPool

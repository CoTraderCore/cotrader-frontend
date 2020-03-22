import React, { Component } from 'react'
import BuyPool from './BuyPool'
import SellPool from './SellPool'
import { Form } from "react-bootstrap"
import { Typeahead } from 'react-bootstrap-typeahead'
import { NeworkID, ParaswapApi } from '../../../../config.js'
import axios from 'axios'

const componentList = {
  Buy: BuyPool,
  Sell: SellPool
}

class UniswapPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      action: 'Buy',
      symbols: [],
      tokens: [],
      tokenAddress: ''
    }
  }

  componentDidMount(){
    this.initData()
  }


  // get tokens addresses and symbols from paraswap api
  initData = async () => {
    let tokens
    let symbols
    if(NeworkID === 1 || NeworkID === 42){
      // get data from Paraswap api
      try{
         tokens = await axios.get(ParaswapApi + '/tokens')
         tokens = tokens.data.tokens
         symbols = []
         for(let i = 0; i< tokens.length; i++){
           symbols.push(tokens[i].symbol)
         }
       }catch(e){
         alert("Can not get data from api, please try again latter")
         console.log(e)
      }
      console.log("get data")
    }else{
       // test data for Ropsten
       symbols = ['NAP']
       tokens = [{symbol:'NAP', address:'0x2f5cc2e9353feb3cbe32d3ab1ded9e469fad88c4'}]
    }

    this.setState({ tokens, symbols })
  }

  findAddressBySymbol = (symbol) => {
    const tokenObj = this.state.tokens.find((item) => item.symbol && item.symbol === symbol)
    if(tokenObj){
      return tokenObj.address
    }else{
      return null
    }
  }

  render() {
    // Change component (Buy/Sell/Swap) dynamicly
    let CurrentAction
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
               onChange={(s) => this.setState({tokenAddress: this.findAddressBySymbol(s[0])})}
               placeholder="Choose a symbol"
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

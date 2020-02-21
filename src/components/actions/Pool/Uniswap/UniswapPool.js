import React, { Component } from 'react'
import BuyPool from './BuyPool'
import SellPool from './SellPool'
import { Form } from "react-bootstrap"
import { Typeahead } from 'react-bootstrap-typeahead'
import { NeworkID } from '../../../../config.js'

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
    this.setData()
  }

  setData = () => {
    // For test Uniswap in Ropsten
    if(NeworkID === 3){
      const symbols = ['MST']
      const tokens = [{'MST':'0xab726e4664d1c28B084d77cD9be4eF18884e858d'}]
      this.setState({ symbols, tokens })
    }
  }

  findAddressBySymbol = (symbol) =>{
    const address = this.state.tokens.map(item => item[symbol])
    return address[0]
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

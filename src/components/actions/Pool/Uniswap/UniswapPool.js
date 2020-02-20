import React, { Component } from 'react'
import BuyPool from './BuyPool'
import SellPool from './SellPool'
import { Form } from "react-bootstrap"


const componentList = {
  Buy: BuyPool,
  Sell: SellPool
}

class UniswapPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      action: 'Buy'
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
            {/* Render current action */}
             <CurrentAction
               fromAddress={this.state.fromAddress}
               web3={this.props.web3}
               accounts={this.props.accounts}
               smartFundAddress={this.props.smartFundAddress}
               pending={this.props.pending}
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

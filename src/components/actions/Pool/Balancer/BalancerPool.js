import React, { PureComponent } from 'react'
import { Form } from "react-bootstrap"
import BuyPool from './BuyPool'
import SellPool from './SellPool'


class BalancerPool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      action: 'Buy'
    }
  }

  getCurrentAction(action){
    if(!this.state.action || action === 'Buy'){
      return BuyPool
    }
    else {
      return SellPool
    }
  }

  render() {
    const CurrentAction = this.getCurrentAction(this.state.action)
    return (
     <>
      <Form>
        <Form.Group>
        <Form.Label>Selet action for Balancer pool</Form.Label>
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
     </>
    )
  }

}

export default BalancerPool

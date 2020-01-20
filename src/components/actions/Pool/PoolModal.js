import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
import { CoTraderBancorEndPoint } from '../../../config.js'
import axios from 'axios'

import { Typeahead } from 'react-bootstrap-typeahead'

import BuyPool from './BuyPool'
import SellPool from './SellPool'
import SwapPool from './SwapPool'

const componentList = {
  Buy: BuyPool,
  Sell: SellPool,
  Swap: SwapPool
}

class PoolModal extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      symbols: null,
      smartTokenSymbols: null,
      tokensObject: null,
      action: 'Buy',
      from:''
    }
  }

  _isMounted = false
  componentDidMount(){
    this._isMounted = true
    this.initData()

  }

  componentWillUnmount(){
    this._isMounted = false
  }

  initData = async () => {
    const res = await axios.get(CoTraderBancorEndPoint + 'official')
    const tokensObject = res.data.result
    const symbols = res.data.result.map(item => item.symbol)
    const smartTokenSymbols = res.data.result.map(item => item.smartTokenSymbol)
    this.setState({ tokensObject, symbols, smartTokenSymbols })
  }


  render() {
    let modalClose = () => this.setState({ Show: false })

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
      <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
        Pool
      </Button>

      <Modal
        show={this.state.Show}
        onHide={modalClose}
      >
        <Modal.Header closeButton>
        <Modal.Title>
        Pool
        </Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <Form>
            <Form.Group>
            <Form.Label>Selet action for pool</Form.Label>
            <Form.Control
            as="select"
            size="sm"
            name="selectAction"
            onChange={(e) => this.setState({ action:e.target.value })}>
            {/* NOTE: render of actions components dependse of this actions*/}
            <option>Buy</option>
            <option>Sell</option>
            <option>Swap</option>
            </Form.Control>
            </Form.Group>
           </Form>
            {
              this.state.action !== 'Swap'
              ?
              (
                <React.Fragment>
                <Typeahead
                  labelKey="smartTokenSymbols"
                  multiple={false}
                  id="smartTokenSymbols"
                  options={this.state.smartTokenSymbols}
                  onChange={(s) => this.setState({from: s[0]})}
                  placeholder="Choose a symbol for send"
                 />
                 <br/>
                <CurrentAction from={this.state.from} />
                </React.Fragment>
              )
              :
              (
                <CurrentAction
                smartTokenSymbols={this.state.smartTokenSymbols}
                tokensObject={this.state.tokensObject}
                symbols={this.state.symbols}
                />
              )
            }

        </Modal.Body>
      </Modal>

      </React.Fragment>
    )
  }
}

export default PoolModal

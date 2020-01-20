import React, { Component } from 'react'
import { Button, Form } from "react-bootstrap"
import { Typeahead } from 'react-bootstrap-typeahead'

class SwapPool extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      toAddress:'',
      fromAddress:'',
      isToERC20:false,
      isFromERC20:false,
      amount:'0'
    }
  }

  render() {
    return (
      <React.Fragment>

      <Form.Group>
      <Form.Check
      type="checkbox"
      label="hide relays, show tokens"
      onChange={() => this.setState({ isFromERC20 : !this.state.isFromERC20 })}/>
      </Form.Group>

      <Typeahead
        labelKey="smartTokenSymbols"
        multiple={false}
        id="smartTokenSymbols"
        options={ this.state.isFromERC20 ? this.props.symbols : this.props.smartTokenSymbols }
        onChange={(s) => this.setState(
          {fromAddress: this.props.findAddressBySymbol(s[0], this.state.isFromERC20)}
        )}
        placeholder="Choose a symbol for send"
      />
      <br/>

      <Form.Group>
      <Form.Check
      type="checkbox"
      label="hide relays, show tokens"
      onChange={() => this.setState({ isToERC20 : !this.state.isToERC20 })} />
      </Form.Group>

      <Typeahead
        labelKey="smartTokenSymbols"
        multiple={false}
        id="smartTokenSymbols"
        options={ this.state.isToERC20 ? this.props.symbols : this.props.smartTokenSymbols}
        onChange={(s) => this.setState(
          {toAddress: this.props.findAddressBySymbol(s[0], this.state.isToERC20)}
        )}
        placeholder="Choose a symbol for recieve"
      />
      <br/>
      <Form.Control
      placeholder="Enter amount for send"
      name="amount"
      type="number" min="1"/>
      <br/>
      <Button variant="outline-primary">Swap</Button>
      </React.Fragment>
    )
  }

}

export default SwapPool

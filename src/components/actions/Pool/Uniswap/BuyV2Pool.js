import React, { PureComponent } from 'react'
import { Typeahead } from 'react-bootstrap-typeahead'
import { isAddress } from 'web3-utils'
import { Form, Button, Alert } from "react-bootstrap"


class BuyV2Pool extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      secondConnector:'',
      firstConnectorAmount:0,
      secondConnectorAmount:0,
      secondConnectorSymbol:''
    }
  }

  addLiquidity = async () => {

  }

  render() {
    return (
      <>
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
          placeholder={`Enter ${this.props.selectedSymbol} amount`}
          />
          </Form.Group>
          <Form.Group>
          <Form.Control
          type="number"
          min="0"
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
        ):null
      }
      </>
    )
  }

}

export default BuyV2Pool

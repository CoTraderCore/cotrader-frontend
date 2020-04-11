// cors
// https://www.synthetix.io/page-data/tokens/page-data.json

import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
//import { NeworkID, ERC20ABI, SmartFundABIV5 } from '../../config.js'
import { Typeahead } from 'react-bootstrap-typeahead'

import synthTokens from '../../tokens/synthTokens'

class TradeSynth extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      symbols: [],
      tokens:[],
      synthAddress:'',
      amount:0
    }
  }

  componentDidMount(){
    const symbols = synthTokens.map(item => item.symbol)
    this.setState({
      symbols,
      tokens:synthTokens
    })
  }

  findAddressBySymbol = (symbol) => {
    const tokenObj = this.state.tokens.find((item) => item.symbol && item.symbol === symbol)
    if(tokenObj){
      return tokenObj.address
    }else{
      return null
    }
  }

  modalClose = () => this.setState({ Show: false, action:'Loan' })
  render() {
    return (
      <React.Fragment>
      <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
        Synthetix
      </Button>

      <Modal
        show={this.state.Show}
        onHide={() => this.modalClose()}
      >
        <Modal.Header closeButton>
        <Modal.Title>
        Synthetix
        </Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form>
        <Typeahead
          labelKey="compoundSymbols"
          multiple={false}
          id="compoundSymbols"
          options={this.state.symbols}
          onChange={(s) => this.setState({synthAddress: this.findAddressBySymbol(s[0])})}
          placeholder="Choose a symbol"
        />
        <br/>
        </Form>
        </Modal.Body>
      </Modal>

      </React.Fragment>
    )
  }

}

export default TradeSynth

import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
import { CoTraderBancorEndPoint } from '../../config.js'
import axios from 'axios'


class PoolModal extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,
      symbols: null,
      smartTokenSymbols: null,
      tokensObject: null
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
    let modalClose = () => this.setState({ Show: false });

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
            <Form.Label>Action</Form.Label>
            <Form.Control as="select" size="sm" name="selectAction">
            <option>Add liquidity</option>
            <option>Remove liquidity</option>
            <option>Swap</option>
            </Form.Control>
            </Form.Group>
           </Form>
        </Modal.Body>
      </Modal>
      </React.Fragment>
    )
  }
}

export default PoolModal

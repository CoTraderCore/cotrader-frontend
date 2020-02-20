import React, { Component } from 'react'
import { Button, Modal, Tabs, Tab } from 'react-bootstrap'
import BancorPool from './Bancor/BancorPool'
import Uniswap from './Uniswap/UniswapPool'


class PoolModal extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false
    }
  }

  modalClose = () => this.setState({ Show: false })
  render() {
    return (
      <React.Fragment>
      <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
        Pool
      </Button>
      <Modal
        show={this.state.Show}
        onHide={() => this.modalClose()}
      >
      <Modal.Header closeButton>
      <Modal.Title>
      Pool
      </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs>
        <Tab eventKey="bancor" title="Bancor">
        <br/>
           <BancorPool
           web3={this.props.web3}
           accounts={this.props.accounts}
           smartFundAddress={this.props.smartFundAddress}
           modalClose={this.props.modalClose}
           pending={this.props.pending}
           />
        </Tab>
        <Tab eventKey="uniswap" title="Uniswap">
        <br/>
          <Uniswap />
        </Tab>
        </Tabs>
      </Modal.Body>
      </Modal>
      </React.Fragment>
    )
  }
}

export default PoolModal

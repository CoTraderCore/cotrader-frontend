import React, { Component } from 'react'
import { Button, Modal, Form } from "react-bootstrap"
import { CoTraderBancorEndPoint } from '../../config.js'
import axios from 'axios'


class PoolModal extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      Show: false,

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
    const data = await axios.get(CoTraderBancorEndPoint + '/official')
    console.log(data)
  }


  render() {
    let modalClose = () => this.setState({ Show: false });

    return (
      <React.Fragment>
      <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
        Pool
      </Button>
      </React.Fragment>
    )
  }
}

export default PoolModal

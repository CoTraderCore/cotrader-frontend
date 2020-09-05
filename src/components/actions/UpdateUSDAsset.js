import React, { Component } from 'react'
import { SmartFundABIV4, SmartFundABIV7, EtherscanLink } from '../../config.js'
import { Button, Modal, Form, Alert } from "react-bootstrap"
import { isAddress, fromWei } from 'web3-utils'

// permitted stable coins
const symblols = ["DAI", "USDT", "USDC", 'USDB']
const assets = {
  'DAI' : '0x6b175474e89094c44da98b954eedeac495271d0f',
  'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  'USDB': '0x309627af60f0926daa6041b8279484312f2bf060'
}


class UpdateUSDAsset extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      newUSDTokenAddress:'',
      currentUSDTokenAddress:'',
      currentUSDTokenSymbol:'',
      symblols:[],
      assets:[],
      fundContract:null,
      Show:false,
      ShowSuccessesMsg:false,
      totalWeiDeposited:0
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
    let fundContract
    let currentUSDTokenAddress

    // get core asset dependse of version
    if(this.props.version >= 6){
      fundContract = new this.props.web3.eth.Contract(SmartFundABIV7, this.props.smartFundAddress)
      currentUSDTokenAddress = await fundContract.methods.coreFundAsset().call()
    }else{
      fundContract = new this.props.web3.eth.Contract(SmartFundABIV4, this.props.smartFundAddress)
      currentUSDTokenAddress = await fundContract.methods.stableCoinAddress().call()
    }

    const totalWeiDepositedInWei = await fundContract.methods.totalWeiDeposited.call()
    const totalWeiDeposited = Number(fromWei(String(totalWeiDepositedInWei)))
    const currentUSDTokenSymbol = Object.keys(assets).find(
      k => assets[k].toLowerCase() === currentUSDTokenAddress.toLowerCase())

    if(this._isMounted)
      this.setState({
        currentUSDTokenAddress,
        currentUSDTokenSymbol,
        symblols,
        fundContract,
        totalWeiDeposited
      })
  }

  setAddressBySymbol = (e) =>{
    for(let [key, value] of Object.entries(assets)) {
     if(key === e.target.value)
        this.setState({ newUSDTokenAddress: value })
    }
  }

  changeUSDToken = async () => {
    if(isAddress(this.state.newUSDTokenAddress)){
      this.state.fundContract.methods.changeStableCoinAddress(this.state.newUSDTokenAddress)
      .send({ from:this.props.accounts[0] })
      .on('transactionHash', (hash) => {
        this.setState({ ShowSuccessesMsg:true })
      })
    }else{
      alert('Please select token')
    }
  }

  render() {
    let modalClose = () => this.setState({ Show: false });

    return (
      <div>
        <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
          Stable tokens
        </Button>

        <Modal
          show={this.state.Show}
          onHide={modalClose}
        >
          <Modal.Header closeButton>
          <Modal.Title>
          Update USD asset
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <Alert variant="secondary">
            Your current fund USD token : &nbsp;
            <strong>
            <a href={EtherscanLink + "token/" + this.state.currentUSDTokenAddress} target="_blank" rel="noopener noreferrer">{this.state.currentUSDTokenSymbol}</a>
            </strong>
          </Alert>
          <Form>
          <Form.Group>
          <Form.Text className="text-muted">
           <strong>Set new USD token</strong>
          </Form.Text>
          <Form.Control
           as="select"
           onChange={(e) => this.setAddressBySymbol(e)}
          >
            <option>...</option>
            { this.state.symblols.map((item, key) => (<option key={key}>{item}</option>))}
          </Form.Control>
          </Form.Group>

          {
            this.state.totalWeiDeposited === 0
            ?
            (
              <Button variant="outline-primary" onClick={() => this.changeUSDToken()}>
                Set new token
              </Button>
            )
            :
            (
              <Alert variant="danger">
              <small>
              You can't change stable coin address, because a deposit has already been made in the current USD token
              </small>
              </Alert>
            )
          }
          {
            this.state.ShowSuccessesMsg
            ?
            (
              <>
              <br/>
              <br/>
              <Alert variant="success">Token will be changed after confirmation of the transaction</Alert>
              </>
            ):null
          }
          </Form>
          </Modal.Body>
        </Modal>

      </div>
    )
  }
}

export default UpdateUSDAsset

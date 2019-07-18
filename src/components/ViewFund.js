import React, { Component } from 'react'

import getFundData from '../utils/getFundData'
import { Card, Row, Col, ListGroup, Badge, Alert } from "react-bootstrap"

import { EtherscanLink, APIEnpoint }  from '../config.js'
import io from "socket.io-client"

import TradeModal from './actions/TradeModal'
import WithdrawManager from './actions/WithdrawManager'
import WhiteList from './actions/WhiteList'
import FakeButton from './templates/FakeButton'
import ChartsButton from './actions/ChartsButton'
import Withdraw from './actions/Withdraw'
import Deposit from './actions/Deposit'
import UserHoldings from './actions/UserHoldings'

import Loading from './templates/Spiners/Loading'
import Pending from './templates/Spiners/Pending'
import PopupMsg from './templates/PopupMsg'


import ViewPageCharts from './charts/ViewPageCharts'
import InvestorsAlocationChart from './charts/InvestorsAlocationChart'

import AssetsAlocationChart from './charts/AssetsAlocationChart'

class ViewFund extends Component {
  constructor(props, context) {
    super(props, context)
    this._popupChild = React.createRef()

     this.state = {
     smartFundAddress: '',
     name: '',
     balance: [],
     owner: '',
     profit: '0',
     value: '0',
     managerTotalCut: '0',
     managerRemainingCut: '0',
     pending: false,
     popupMsg: false,
     isDataLoad: false,
     txName: '',
     txHash:'',
     lastHash: '',
     shares: []
    }
}

 _isMounted = false;

 componentDidMount = async () => {
   this._isMounted = true;
   await this.loadData()
   if(this._isMounted)
   this.initSocket()
}

 componentWillUnmount(){
   this._isMounted = false;
 }


 // TODO move this to separate file
 initSocket = ()=>{
   const socket = io(APIEnpoint)
     socket.on('connect', ()=>{
     socket.on('Deposit', (address, hash) => {
     this.txUpdate('deposit', address, hash)
     })

     socket.on('Withdraw', (address, hash) => {
     this.txUpdate('withdraw', address, hash)
     })

     socket.on('Trade', (address, hash) => {
     this.txUpdate('trade', address, hash)
     })
   })
 }

 txUpdate = (txName, address, hash) => {
   if(address === this.props.match.params.address && this.state.lastHash !== hash){
     if(this._isMounted){
      this.setState({ lastHash: hash })
      this.setState({ txName:txName, txHash:hash })

      this.updateBalance()
      this.pending(false)

      if(this._popupChild.current)
      this.showPopup()
   }
   }
 }

 loadData = async () => {
   const fund = await getFundData(this.props.match.params.address)

   if(this._isMounted){
    this.setState({
      smartFundAddress: fund.data.result.address,
      name: fund.data.result.name,
      balance: JSON.parse(fund.data.result.balance),
      owner: fund.data.result.owner,
      profit: fund.data.result.profit,
      value: fund.data.result.value,
      managerTotalCut: fund.data.result.managerTotalCut,
      managerRemainingCut: fund.data.result.managerRemainingCut,
      //smartBankAddress: fund.data.result.bank,
      shares: fund.data.result.shares,
      isDataLoad:true
     });
    }
 }

 updateBalance = async () => {
   const fund = await getFundData(this.props.match.params.address)

   if(this._isMounted){
    this.setState({
      balance: JSON.parse(fund.data.result.balance),
      profit: fund.data.result.profit,
      value: fund.data.result.value,
      managerTotalCut: fund.data.result.managerTotalCut,
      managerRemainingCut: fund.data.result.managerRemainingCut,
      shares: fund.data.result.shares
     });
    }
 }

 pending = (_bool) => {
   if(this._isMounted)
   this.setState({ pending:_bool})
 }

 showPopup() {
   if(this._popupChild.current)
   this._popupChild.current.show()
 }


 render() {
    return (
    <React.Fragment>
    {
      this.props.web3 && this.state.isDataLoad
      ?
      (
        <React.Fragment>
        <PopupMsg txName={this.state.txName} txHash={this.state.txHash} ref={this._popupChild} />
        {
          this.state.pending
          ?
          (
            <Pending />
          )
          :
          (
            null
          )
        }
        <Card className="text-center">
        <Card.Header className="cardsAdditional">
        <Badge variant="ligth">Fund name: {this.state.name}</Badge>
        </Card.Header>
        <Card.Body>
        <Alert variant="dark">
        <Row>
         <Col>Fund profit: { this.props.web3.utils.fromWei(this.state.profit)}</Col>
         <Col>Fund value: {this.props.web3.utils.fromWei(this.state.value)}</Col>
        </Row>
        </Alert>
        <br />
        <Row>
        <Col><ChartsButton address={this.state.smartFundAddress}/></Col>
        <Col><Deposit web3={this.props.web3} address={this.state.smartFundAddress} accounts={this.props.accounts} pending={this.pending}/></Col>
        <Col><Withdraw web3={this.props.web3} address={this.state.smartFundAddress} accounts={this.props.accounts} pending={this.pending}/></Col>
        <Col><UserHoldings web3={this.props.web3} address={this.state.smartFundAddress} accounts={this.props.accounts} pending={this.pending}/></Col>
       </Row>
        <br />
        <Badge variant="ligth">Manager info</Badge>
        <ListGroup>
         <ListGroup.Item>Total Cut: {this.props.web3.utils.fromWei(this.state.managerTotalCut)}</ListGroup.Item>
         <ListGroup.Item>Remaining cut: {this.props.web3.utils.fromWei(this.state.managerRemainingCut)}</ListGroup.Item>
        </ListGroup>
        <br />
        <Row>
        <Col><InvestorsAlocationChart Data={this.state.shares}/></Col>
        <Col><AssetsAlocationChart AssetsData={this.state.balance}/></Col>
        </Row>
        <br />
        <Badge variant="ligth">Fund balance</Badge>
        <br />
        <ListGroup>
        {
        this.state.balance.length > 0 ?
        (
          this.state.balance.map((item, key) =>
          <ListGroup.Item key={key}>{item["symbol"]}: &nbsp; {this.props.web3.utils.fromWei(item["balance"].toString(), "Ether")}</ListGroup.Item>
        )
        ):
        (
          <ListGroup.Item>No assets in this fund</ListGroup.Item>
        )

        }
        </ListGroup>
        <br />
        <ViewPageCharts address={this.state.smartFundAddress} Data={this.state.balance}/>
        <br />
        <Row>
         <Col>
         {
           this.props.accounts[0] === this.state.owner ?
           (
             <TradeModal web3={this.props.web3} accounts={this.props.accounts} smartFundAddress={this.state.smartFundAddress} pending={this.pending}/>
           )
           :
           (
             <FakeButton buttonName={"Exchange"} info={"You can't use this button cause You are not owner of this smart fund"}/>
           )
         }
         </Col>
         <Col>
         {
           this.props.accounts[0] === this.state.owner ?
           (
             <WithdrawManager web3={this.props.web3} accounts={this.props.accounts} smartFundAddress={this.state.smartFundAddress} owner={this.state.owner} pending={this.pending}/>
           )
           :
           (
             <FakeButton buttonName={"Take cut"} info={"You can't use this button cause You are not owner of this smart fund"}/>
           )
         }
         </Col>
         <Col>
         {
           this.props.accounts[0] === this.state.owner ?
           (
             <WhiteList web3={this.props.web3} accounts={this.props.accounts} smartFundAddress={this.state.smartFundAddress} owner={this.state.owner}/>
           )
           :
           (
             <FakeButton buttonName={"White list"} info={"You can't use this button cause You are not owner of this smart fund"}/>
           )
         }
         </Col>
        </Row>
        </Card.Body>
        <Card.Footer className="text-muted cardsAdditional">
        <Row>
         <Col>Smart fund: <a href={EtherscanLink + "address/" + this.state.smartFundAddress} target="_blank" rel="noopener noreferrer"> {this.state.smartFundAddress}</a></Col>
         <Col>Owner: <a href={EtherscanLink + "address/" + this.state.owner} target="_blank" rel="noopener noreferrer">{this.state.owner}</a></Col>

        </Row>
        </Card.Footer>
        </Card>
        </React.Fragment>

      )
      :
      (<Loading />)
    }
    </React.Fragment>
    )
  }
}

export default ViewFund

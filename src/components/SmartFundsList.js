import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import axios from 'axios'

import getFundsList from "../utils/getFundsList"
import getFundData from "../utils/getFundData"

import { Card, ListGroup, Row, Col, Badge, Button, ButtonGroup } from "react-bootstrap"
import { NavLink } from 'react-router-dom'
import { NeworkID, APIEnpoint } from '../config'

import io from "socket.io-client"

import UpgradableCard from './UpgradableCard'
import Withdraw from './actions/Withdraw'
import Deposit from './actions/Deposit'
import CreateNewFund from './actions/CreateNewFund'
import ChartsButton from './actions/ChartsButton'
import FakeButton from './templates/FakeButton'
import UserHoldings from './actions/UserHoldings'
import ManagerModal from './actions/ManagerModal'
import FundModal  from './actions/FundModal'

import Loading from './templates/Spiners/Loading'
import Pending from './templates/Spiners/Pending'
import PopupMsg from './templates/PopupMsg'

import MainPageCharts from './charts/MainPageCharts'
import PagePagination from './navigation/PagePagination'
import FundSearch from './navigation/FundSearch'
import FundsNav from './navigation/FundsNav'

class SmartFundsList extends Component{
  constructor(props, context) {
    super(props, context);
    this._popupChild = React.createRef()

    this.state = {
      pending:false,
      txName: '',
      txHash:'',
      lastHash: '',
      txCount:0
    }
  }

  _isMounted = false;

  componentDidMount=  async () => {
    this._isMounted = true
    this.initSocket()
    this.checkPending()
  }

  componentWillUnmount(){
    this._isMounted = false;
  }

  // Update all list
  updateSFList = async () => {
    const smartFunds = await getFundsList()
    this.props.MobXStorage.initSFList(smartFunds)
    this.checkPending()
  }

  // Update card footer with profit and value
  updateSingleSF = async (address) => {
    this.checkPending()
    const fund = await getFundData(address)
    if(this.refs[address])
      this.refs[address].UpdateValue(
         fund.data.result.profitInETH,
         fund.data.result.profitInUSD,
         fund.data.result.valueInETH,
         fund.data.result.valueInUSD
      )
  }

  // props for create fund action
  pending = (_bool, _txCount) => {
    this.setState({ pending:_bool, txCount:_txCount })
  }

  checkPending = async () => {
    if(this.props.accounts){
      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + this.props.accounts[0])
      txCount = txCount.data.result

      const pending = Number(txCount) === 0 ? false : true
      if(this._isMounted)
         this.setState({ pending, txCount })
    }
  }

  showPopup() {
    if(this._popupChild.current)
    this._popupChild.current.show()
  }


  // TODO move this to separate file
  initSocket = ()=>{
    const socket = io(APIEnpoint)
    socket.on('connect', ()=>{
      socket.on('AddedNewSmartFund', (address, hash, user) => {
        this.txUpdate('added new fund', address, user, hash)
      })

      socket.on('Deposit', (address, hash, user) => {
        this.txUpdate('deposit', address, user, hash)
      })

      socket.on('Withdraw', (address, hash, user) => {
        this.txUpdate('withdraw',address, user, hash)
      })
    })
  }

  txUpdate = (txName, address, user, hash) => {
    if(this.props.MobXStorage.account[0] === user && this.state.lastHash !== hash){
      if(this._isMounted){
      this.setState({ lastHash: hash })
      this.setState({ txName:txName, txHash:hash })
      this.checkPending()

      if(txName === "added new fund"){
        this.updateSFList()
      }else{
        this.updateSingleSF(address)
      }

      if(this._popupChild.current)
      this.showPopup()
      }
    }
  }

 render() {
  return(
     <React.Fragment>
     {
       this.props.isDataLoad ?(
         <React.Fragment>
         <PopupMsg txName={this.state.txName} txHash={this.state.txHash} ref={this._popupChild} />
         {
           this.state.pending
           ?
           (
             <>
             <div align="center">
             <small>
             Pending transitions : {this.state.txCount}
             </small>
             </div>
             <Pending />
             </>
           )
           :
           (
             null
           )
         }

         <Row className="justify-content-md-center">
         <div className="col-lg-6 col-sm-6 col createfund-btn">
            <CreateNewFund web3={this.props.web3} accounts={this.props.accounts} pending={this.pending}/>
         </div>
         <div className="col-lg-6 col-sm-6 col filter-fund">
            <FundSearch />
         </div>

         <div className="col-lg-12 col-sm-12">
         <div className="total-found">
         {
          !this.props.MobXStorage.FilterActive ?
          (
            <>
            <h4>
            <Badge variant="ligth">
            <span>Total funds: {this.props.MobXStorage.SmartFundsOriginal.length}</span>
            </Badge>
            </h4>
            <small>Total value: ${this.props.MobXStorage.TotalValue}</small>
            <br/>
            <small>Total profit: ${this.props.MobXStorage.TotalProfit}</small>
            <br/>
            </>
          ):
          (
            <div align="center">
            <strong>
            Found </strong>
            <br/>
            <small>
            {this.props.MobXStorage.SmartFunds.length}
            &nbsp;
            of
            &nbsp;
            {this.props.MobXStorage.SmartFundsOriginal.length}
            &nbsp;
            funds.
            &nbsp;
            </small>
            <br/>
            <small style={{color:"green"}}>{this.props.MobXStorage.FilterInfo}</small>
            <br/>
            <small>Total value: ${this.props.MobXStorage.userTotalValue}</small>
            <br/>
            <small>Total profit: ${this.props.MobXStorage.userTotalProfit}</small>
            <br/>
            </div>
          )
         }
         </div>
         </div>
         </Row>

         <FundsNav/>

         <ListGroup variant="flush">
         { this.props.MobXStorage.SmartFunds.length > 0 ?(
         this.props.MobXStorage.SmartFunds.map((item, key) =>
         <Card className="text-center mb-3" key={item.address}>
         <Card.Header className="cardsAdditional">
         <Badge variant="ligth">Fund name: {item.name}</Badge>
         <br/>
         <small>Type : {item.mainAsset} based fund, version: {String(item.version)}</small>
         </Card.Header>
         <Card.Body className="cardsAdditional">
         <Row className="justify-content-md-center mb-3">
          <Col><FundModal address={item.address}/></Col>
          <Col><ManagerModal address={item.owner}/></Col>
         </Row>

         <div className="justify-content-md-center">
          {
            NeworkID === 1 ?
            (
              <div align="center">
              <MainPageCharts address={item.address} />
              </div>
            )
            :
            (
              <strong>Charts available only in mainnet</strong>
            )
          }
          </div>
          <Row className="justify-content-md-center mb-3">
          <Col className="col-lg-12 col-sm-12">
          <ButtonGroup horizontal="true">
          <NavLink to={"/fund/"+item.address}><Button variant="outline-primary" className="buttonsAdditional">Fund page</Button></NavLink>
          <Deposit web3={this.props.web3} address={item.address} accounts={this.props.accounts} mainAsset={item.mainAsset} pending={this.pending}/>
          <Withdraw web3={this.props.web3} address={item.address} accounts={this.props.accounts} pending={this.pending} version={item.version} mainAsset={item.mainAsset}/>
          <UserHoldings web3={this.props.web3} address={item.address} accounts={this.props.accounts}/>
          {
            NeworkID === 1 ?
            (
              <ChartsButton address={item.address}/>
            ):
            (
              <FakeButton buttonName={"Bloxy"} info={"This button is available only in mainnet"}/>
            )
          }
          </ButtonGroup>
          </Col>
         </Row>
         </Card.Body>
         <UpgradableCard
           ref={item.address}
           profitInETH={item.profitInETH}
           profitInUSD={item.profitInUSD}
           valueInETH={item.valueInETH}
           valueInUSD={item.valueInUSD}
         />
         </Card>
         )
         )
         :(null)
         }
         </ListGroup>
         {
           !this.props.MobXStorage.FilterActive
           ?
           (
            <PagePagination/>
           )
           :(null)
         }
         </React.Fragment>
       ):(
         <Loading />
       )
     }
     </React.Fragment>
   )
 }
}

export default inject('MobXStorage')(observer(SmartFundsList));

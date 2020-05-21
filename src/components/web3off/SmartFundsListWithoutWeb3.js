/*
* Just component without web3
*/

import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import getFundsList from "../../utils/getFundsList"
import { fromWei } from 'web3-utils'

import { Card, ListGroup, Row, Col, Badge, Button, ButtonGroup } from "react-bootstrap"
import { NeworkID } from '../../config'
import { NavLink } from 'react-router-dom'

import MainPageCharts from '../charts/MainPageCharts'

import FakeButton from '../templates/FakeButton'
import FakeMaterializeButton from '../templates/FakeMaterializeButton'
import Web3Allert from './Web3Allert'
import ChartsButton from '../actions/ChartsButton'
import Loading from '../templates/Spiners/Loading'
import ManagerModal from '../actions/ManagerModal'
import FundModal from '../actions/FundModal'

import PagePagination from '../navigation/PagePagination'
import FundSearch from '../navigation/FundSearch'
import FundsNav from '../navigation/FundsNav'


class SmartFundsListWithoutWeb3 extends Component{
  constructor(state, context) {
    super(state, context);

    this.state = {
      isDataLoad:false
    }
  }

  _isMounted = false;

  componentDidMount = async () =>{
    this._isMounted = true

    if(this._isMounted){
    // Get fata for web3 off  component
    const smartFunds = await getFundsList()
    this.props.MobXStorage.initSFList(smartFunds)

    this.setState({
      isDataLoad:true
    })
  }
  }

  componentWillUnmount(){
  this._isMounted = false;
  }

  // if coonected to web3 go out from web3off
  componentDidUpdate(nextProps){
    if(nextProps.web3){
      window.location = "/"
    }
  }

  render() {
   return(
     <React.Fragment>
      {
        this.state.isDataLoad ? (
          <React.Fragment>
            <Web3Allert />
            <Row className="justify-content-md-center">

            <div className="col-lg-6 col-sm-6 col createfund-btn">
               <FakeMaterializeButton buttonName={"Create fund"} info={"please connect to web3"}/>
            </div>

            <div className="col-lg-6 col-sm-6 col filter-fund">
               <FundSearch />
            </div>

            <div className="col-lg-12 col-sm-12">
            <div className="total-found">
            {
             !this.props.MobXStorage.FilterActive ?
             (
               <h4>
               <Badge variant="ligth">
               <span>Total funds: {this.props.MobXStorage.SmartFundsOriginal.length}</span>
               </Badge>
               </h4>
             ):
             (
               <div align="center">
               <strong>
               Found </strong>
               <br/>
               <small> {this.props.MobXStorage.SmartFunds.length} of {this.props.MobXStorage.SmartFundsOriginal.length} funds. {this.props.MobXStorage.FilterInfo}</small>
               <br/>
               </div>
             )
            }
            </div>
            </div>
            </Row>

             <FundsNav />
             <ListGroup variant="flush">
             {
             this.props.MobXStorage.SmartFunds.map((item, key) =>
             <Card className="text-center mb-3" bg="ligth" key={item.address}>
             <Card.Header className="cardsAdditional">
             <Badge variant="ligth">{item.name}</Badge>
             <br/>
             <small>Type : {item.mainAsset} based fund, version: {String(item.version)}</small>
             </Card.Header>
             <Card.Body className="cardsAdditional">
             <Row className="justify-content-md-center">
             <Col><FundModal address={item.address}/></Col>
             <Col><ManagerModal address={item.owner}/></Col>
             </Row>
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
             <div>
             <ButtonGroup horizontal="true">
             <NavLink to={"/web3off/fund/"+ item.address}><Button variant="outline-primary" className="buttonsAdditional">Fund Page</Button></NavLink>
             <FakeButton buttonName={"Deposit"} info={"please connect to web3"}/>
             <FakeButton buttonName={"Withdraw"} info={"please connect to web3"}/>
             <FakeButton buttonName={"My Funds"} info={"please connect to web3"}/>
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
             </div>
             </Card.Body>
             <Card.Footer className="text-muted cardsAdditional">
             <small>
               <Row>
               <Col>Fund profit in ETH: { fromWei(item.profitInETH, 'ether')}</Col>
               <Col>Fund profit in USD: { fromWei(item.profitInUSD, 'ether')}</Col>
               <Col>Fund value in ETH: { fromWei(item.valueInETH, 'ether') }</Col>
               <Col>Fund value in USD: { fromWei(item.valueInUSD, 'ether') }</Col>
               </Row>
             </small>
             </Card.Footer>
             </Card>
             )
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
        ):(<Loading />)
      }

     </React.Fragment>
   )
 }
}

export default inject('MobXStorage')(observer(SmartFundsListWithoutWeb3));

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
    console.log(this.props.MobXStorage.FilterInfo)
   return(
     <React.Fragment>
      {
        this.state.isDataLoad ? (
          <React.Fragment>
            <Web3Allert />
             <Row className="justify-content-md-center">
             <Col className="col-8"><strong><FakeButton buttonName={"Create new fund"} info={"please connect to web3"}/></strong></Col>
             <Col>
             <FundSearch />
             </Col>
             <Col>
             <h3>
             <Badge variant="ligth">

             {
              !this.props.MobXStorage.FilterActive ?
              (
                <p>Total funds: {this.props.MobXStorage.SmartFundsOriginal.length}</p>
              ):
              (
                <div>
                <p>
                Found {this.props.MobXStorage.SmartFunds.length} of {this.props.MobXStorage.SmartFundsOriginal.length} funds
                </p>
                <small>{this.props.MobXStorage.FilterInfo}</small>
                </div>
              )
             }
             </Badge>
             </h3>
             </Col>
             </Row>
             <br />
             <FundsNav />
             <ListGroup variant="flush">
             {
             this.props.MobXStorage.SmartFunds.map((item, key) =>
             <Card className="text-center mb-3" bg="ligth" key={item.address}>
             <Card.Header className="cardsAdditional">
             <Badge variant="ligth">{item.name}</Badge>
             </Card.Header>
             <Card.Body className="cardsAdditional">
             <Row className="justify-content-md-center">
             <Col><FundModal address={item.address}/></Col>
             <Col><ManagerModal address={item.owner}/></Col>
             {
               NeworkID === 1 ?
               (
                 <MainPageCharts address={item.address} />
               )
               :
               (
                 <strong>Charts available only in mainnet</strong>
               )
             }
             <Col>
             <ButtonGroup vertical>
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
             </Col>
             </Row>
             </Card.Body>
             <Card.Footer className="text-muted cardsAdditional">
               <Row>
               <Col>Fund profit: { fromWei(item.profit, 'ether')}</Col>
               <Col>Fund value: { fromWei(item.value, 'ether') }</Col>
               </Row>
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

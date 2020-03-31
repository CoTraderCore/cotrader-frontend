import React, { Component } from 'react'
import { NeworkID, EtherscanLink }  from '../../config.js'
import getFundData from '../../utils/getFundData'
import { Card, Row, Col, ListGroup, Badge, Alert } from "react-bootstrap"
import { fromWei } from 'web3-utils'
// Components
import Web3Allert from './Web3Allert'
import FakeButton from '../templates/FakeButton'
import ChartsButton from '../actions/ChartsButton'
import ViewPageCharts from '../charts/ViewPageCharts'
import InvestorsAlocationChart from '../charts/InvestorsAlocationChart'


import Loading from '../templates/Spiners/Loading'

class ViewFundWithoutWeb3 extends Component {
  state = {
   smartFundAddress: '',
   name: '',
   balance: [],
   owner: '',
   profit: '0',
   value: '0',
   managerTotalCut: '0',
   managerRemainingCut: '0',
   shares: [],
   isDataLoad: false
  }

 _isMounted = false;

 componentDidMount = async () => {
    this._isMounted = true;
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
        shares: fund.data.result.shares,
        isDataLoad:true
     });
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
  return (
    <React.Fragment>
    {
      this.state.isDataLoad
      ?
      (
      <div>
      <Web3Allert/>
      <Card className="text-center">
        <Card.Header className="cardsAdditional"> <Badge variant="ligth">{this.state.name}</Badge></Card.Header>
        <Card.Body>
        <Alert variant="dark">
        <Row>
         <Col>Fund profit in ETH: { fromWei(this.state.profit, 'ether')}</Col>
         <Col>Fund value in ETH: {fromWei(this.state.value, 'ether')}</Col>
        </Row>
        </Alert>
        <br />
        <div className="fund-page-btns">
        <div align="center"><strong>Investor actions</strong></div>
          <ul>
            <li>{
              NeworkID === 1 ?
              (
                <ChartsButton address={this.state.smartFundAddress}/>
              ):
              (
                <FakeButton buttonName={"ChartsButton"} info={"This button is available only in mainnet"}/>
              )
            }</li>
            <li><FakeButton buttonName={"Deposit"} info={"please connect to web3"}/></li>
            <li><FakeButton buttonName={"Withdraw"} info={"please connect to web3"}/></li>
            <li><FakeButton buttonName={"My profile"} info={"please connect to web3"}/></li>
          </ul>
       </div>
       <br />

        <Badge variant="ligth">Manager info</Badge>
        <div style={{ textAlign: 'center'}}>
        <ListGroup style={{ display: 'inline-block', margin: '10px 0'}}>
         <ListGroup.Item>Total Cut: {fromWei(this.state.managerTotalCut, 'ether')}</ListGroup.Item>
         <ListGroup.Item>Remaining cut: {fromWei(this.state.managerRemainingCut, 'ether')}</ListGroup.Item>
        </ListGroup>
        </div>
        <br />

        <div className="fund-page-charts">
          <div>
            <InvestorsAlocationChart Data={this.state.shares}/>
          </div>
        </div>


        <Badge variant="ligth">Fund balance</Badge>
        <br />
        <div style={{ textAlign: 'center'}}>
        <ListGroup style={{ display: 'inline-block', margin: '10px 0'}}>
        {
          this.state.balance.length > 0 ?
          (
            this.state.balance.map((item, key) =>
            <ListGroup.Item key={key + Math.random()}>{item["symbol"]}: &nbsp; {fromWei(item["balance"], 'ether')}</ListGroup.Item>
          )
          ):
          (
            <ListGroup.Item>No assets in this fund</ListGroup.Item>
          )

        }
       </ListGroup>
       </div>
       <br />
       <div align="center">
       <ViewPageCharts address={this.state.smartFundAddress}/>
       </div>
       <br />

       <div className="fund-page-btns">
       <div align="center"><strong>Manager actions</strong></div>
         <ul>
         <li><FakeButton className="buttonsAdditional" buttonName={"Exchange"} info={"please connect to web3"}/></li>
         <li><FakeButton className="buttonsAdditional" buttonName={"Pool"} info={"please connect to web3"}/></li>
         <li><FakeButton className="buttonsAdditional" buttonName={"Loan"} info={"please connect to web3"}/></li>
         <li><FakeButton className="buttonsAdditional" buttonName={"Take cut"} info={"please connect to web3"}/></li>
         <li><FakeButton className="buttonsAdditional"  buttonName={"White list"} info={"please connect to web3"}/></li>
         </ul>
        </div>
        </Card.Body>
        <Card.Footer className="text-muted cardsAdditional">
        <Row>
         <Col>Smart fund: <a href={EtherscanLink + "address/" + this.state.smartFundAddress} target="_blank" rel="noopener noreferrer">{this.state.smartFundAddress}</a></Col>
         <Col>Owner: <a href={EtherscanLink + "address/" + this.state.owner}target="_blank" rel="noopener noreferrer"> {this.state.owner}</a></Col>
        </Row>
        </Card.Footer>
        </Card>
        </div>
      )
      :
      (
        <Loading />
      )
    }

    </React.Fragment>
    )
  }
}

export default ViewFundWithoutWeb3

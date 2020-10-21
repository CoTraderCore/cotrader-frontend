import React, { Component } from 'react'
import { NeworkID, EtherscanLink }  from '../../config.js'
import getFundData from '../../utils/getFundData'
import { Card, Row, Col, ListGroup, Badge, Alert } from "react-bootstrap"
import { fromWei } from 'web3-utils'
import { fromWeiByDecimalsInput } from '../../utils/weiByDecimals'
// import _ from 'lodash'


// Components
import Web3Allert from './Web3Allert'
import FakeButton from '../templates/FakeButton'
import ChartsButton from '../actions/ChartsButton'
import ViewPageCharts from '../charts/ViewPageCharts'
import InvestorsAlocationChart from '../charts/InvestorsAlocationChart'
import UserInfo from '../templates/UserInfo'
// import AssetsAlocationChart from '../charts/AssetsAlocationChart'

import Loading from '../templates/Spiners/Loading'

class ViewFundWithoutWeb3 extends Component {
  state = {
   smartFundAddress: '',
   name: '',
   balance: [],
   owner: '',
   profitInETH: '0',
   profitInUSD: '0',
   valueInETH: '0',
   valueInUSD: '0',
   managerTotalCut: '0',
   managerRemainingCut: '0',
   shares: [],
   isDataLoad: false,
   mainAsset:''
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
        profitInETH: fund.data.result.profitInETH,
        profitInUSD: fund.data.result.profitInUSD,
        valueInETH: fund.data.result.valueInETH,
        valueInUSD: fund.data.result.valueInUSD,
        managerTotalCut: fund.data.result.managerTotalCut,
        managerRemainingCut: fund.data.result.managerRemainingCut,
        shares: fund.data.result.shares,
        mainAsset: fund.data.result.mainAsset,
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

 // helper for parse pool connectors data
 parsePoolConnectors = (data) => {
   const poolConnectors = data.map((item) => item.symbol)
   return(
    <UserInfo  info={`Pool tokens : ${poolConnectors}`}/>
   )
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
        <small>
        <Row>
         <Col>Fund profit in ETH: { fromWei(String(this.state.profitInETH), 'ether')}</Col>
         <Col>Fund profit in USD: { fromWei(String(this.state.profitInUSD), 'ether')}</Col>
         <Col>Fund value in ETH: {fromWei(String(this.state.valueInETH), 'ether')}</Col>
         <Col>Fund value in USD: {fromWei(String(this.state.valueInUSD), 'ether')}</Col>
        </Row>
        </small>
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
            <ListGroup.Item key={key}>
            {<img
              style={{height: "20px", width: "20px"}}
              src={`http://1inch.exchange/assets/tokens/${String(item["address"]).toLowerCase()}.png`}
              alt="Logo"
              onError={(e)=>{e.target.onerror = null; e.target.src="https://etherscan.io/images/main/empty-token.png"}}/>}
            &nbsp;
            {<a href={EtherscanLink + "token/" + item["address"]} target="_blank" rel="noopener noreferrer">{item["symbol"]}</a>}
            &nbsp;
            :
            &nbsp;
            {fromWeiByDecimalsInput(item["decimals"], item["balance"].toString())}
            &nbsp;
            {
              item["tokensAdditionalData"].length > 0
              ?
              (
                <>
                {this.parsePoolConnectors(item["tokensAdditionalData"])}
                </>
              ):null
            }
            </ListGroup.Item>
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
         {
           this.state.mainAsset === 'USD'
           ?
           (
            <li>
            <FakeButton buttonName={"Stable tokens"} info={"please connect to web3"}/>
            </li>
           )
           : null
         }
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

// TODO Move all props web3 and accounts to mobX
// TODO remove web3 off version, just allow user read contract data from default web3, and require connect for write

import React, { Component } from 'react'
import { inject } from 'mobx-react'
import ReactGA from 'react-ga'

import Footer from './components/static/Footer'
import Header from './components/static/Header'
import HowToStart from './components/static/HowToStart'

import getWeb3 from "./utils/getWeb3"
import getFundsList from "./utils/getFundsList"

import { HashRouter, Route, Switch } from 'react-router-dom'
import { NeworkID }  from './config.js'

import { Alert } from "react-bootstrap"

import SmartFundsList from './components/SmartFundsList'
import ViewFund from './components/ViewFund'
import ViewUserTx from './components/ViewUserTx'
import ViewFundTx from './components/ViewFundTx'

import SmartFundsListWithoutWeb3 from './components/web3off/SmartFundsListWithoutWeb3'
import ViewFundWithoutWeb3 from './components/web3off/ViewFundWithoutWeb3'

import Stake from './components/stake/Stake'

class App extends Component {
  constructor(props, context) {
  super(props, context);
  this.state = {
    web3: null,
    accounts: null,
    isReactGarbagetytyweyety: false,
    network: 0,
    timeOut: false,
    isDataLoad: false
    }
  }

  initializeReactGA() {
    ReactGA.initialize('UA-141893089-1');
    ReactGA.pageview('/');
  }

  componentDidMount = async () => {
    this.initializeReactGA()
    // Time for checking web3 status
    setTimeout(() => {this.setState({
      timeOut:true
    })}, 1000);

    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3()

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts()

      // Set web3 and accounts to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts })

      this.props.MobXStorage.initWeb3AndAccounts(web3, accounts)
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      )
      console.error(error)
    }

    // Get network ID
    this.state.web3.eth.net.getId().then(netId => {
      this.setState({
        network:netId
      })
    })

    // If web3 connected init data for web3on component
    const smartFunds = await getFundsList()
    this.props.MobXStorage.initSFList(smartFunds)

    this.setState({ isDataLoad: true })
  }

  render() {
    // redirect to web3off version if client has no web3
    if(this.state.timeOut && !this.state.web3){
    // temporary solution
    // not redirect client without web3 to web3 off main page
    // if user go to stake page
    if(window.location.href.indexOf('stake') === -1)
      window.location = "/#/web3off"
    }

    return (
      <HashRouter>
      <Header web3={this.state.web3}/>
      {
        // Check network ID
        NeworkID !== this.state.network && this.state.timeOut && this.state.web3 ?
        (
          <Alert variant="danger">
          Wrong network ID, please make sure You use &nbsp;
          {
            NeworkID === 1 ?("Mainnet"):("Ropsten")
          }
          </Alert>
        ):
        (
          null
        )
      }
      <br />
      <div className="container-fluid">
      <Switch>
      <Route path="/web3off/fund/:address" component={(props) => <ViewFundWithoutWeb3 {...props} web3={this.state.web3}/>} />
      <Route exact path="/" component={(props) => <SmartFundsList {...props} web3={this.state.web3} accounts={this.state.accounts} isDataLoad={this.state.isDataLoad}/>} />
      <Route path="/web3off" component={(props) => <SmartFundsListWithoutWeb3 {...props} web3={this.state.web3} />}/>
      <Route path="/fund/:address" component={(props) => <ViewFund {...props} web3={this.state.web3} accounts={this.state.accounts}/>} />
      <Route path="/user-txs/:address" component={(props) => <ViewUserTx {...props} />} />
      <Route path="/fund-txs/:address" component={(props) => <ViewFundTx {...props} />} />
      <Route path="/how-to-start" component={(props) => <HowToStart {...props} />} />
      <Route path="/stake" component={(props) => <Stake {...props} />} />
      </Switch>
      </div>
      <br />
      <Footer />
      </HashRouter>
    )
  }
}

//export default App
export default inject('MobXStorage')(App);

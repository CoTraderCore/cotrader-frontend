import React, { Component } from 'react'
import { StakeAddress, StakeABI, ERC20ABI, COTAddress, EtherscanLink } from '../../config.js'
import { inject } from 'mobx-react'
import { Alert, ButtonGroup } from "react-bootstrap"
import isMobile from '../../utils/isMobile'
import defaultWeb3 from '../../utils/defaultWeb3'

import Approve from './actions/Approve'
import Deposit from './actions/Deposit'
import Withdraw from './actions/Withdraw'
import MyInfo from './actions/MyInfo'
import Paper from '@material-ui/core/Paper'

class Stake extends Component{
  constructor(props, context) {
    super(props, context)
    this.state = {
      stakeContract: null,
      tokenContract:null,
      web3: null,
      isClientWeb3Connected:false,
      account: null,
      reserve: 0,
      freeReserve:0,
      debt:0,
      payout:0,
      contribution:0,
      isMobileSize:false,
      isDataLoad: false
    }
  }

  _isMounted = false

  componentDidMount = () => {
    this._isMounted = true

    setTimeout(async () => {
      let web3
      const account = this.props.MobXStorage.account

      if(this.props.MobXStorage.web3 !== null){
        web3 = this.props.MobXStorage.web3
        this.setState({ isClientWeb3Connected:true })
      }else{
        web3 = defaultWeb3
      }

      if(web3 !== null){
        const stakeContract = web3.eth.Contract(StakeABI, StakeAddress)
        let reserve = await stakeContract.methods.reserve().call()
        reserve = Number(web3.utils.fromWei(web3.utils.hexToNumberString(reserve._hex)))

        let debt = await stakeContract.methods.debt().call()
        debt = Number(web3.utils.fromWei(web3.utils.hexToNumberString(debt._hex)))

        let contribution = await stakeContract.methods.contribution().call()
        contribution = Number(web3.utils.fromWei(web3.utils.hexToNumberString(contribution._hex)))

        let payout = await stakeContract.methods.payout().call()
        payout = Number(web3.utils.fromWei(web3.utils.hexToNumberString(payout._hex)))

        let freeReserve = await stakeContract.methods.calculateFreeReserve().call()
        freeReserve = Number(web3.utils.fromWei(web3.utils.hexToNumberString(freeReserve._hex)))

        const tokenContract = web3.eth.Contract(ERC20ABI, COTAddress)
        const isMobileSize = isMobile()

        if(this._isMounted)
        this.setState({
          web3,
          reserve,
          freeReserve,
          debt,
          account,
          contribution,
          payout,
          stakeContract,
          tokenContract,
          isMobileSize,
          isDataLoad:true
        })
      }
    }, 1000)
  }

  componentWillUnmount(){
    this._isMounted = false
  }

  render(){
    return(
      <React.Fragment>
      {
        this.state.isDataLoad
        ?
        (
          <React.Fragment>
          <Paper style={{padding: '15px'}}>
          <div className="text-center">
          <Alert variant="primary">
          Reserve: {this.state.reserve}, Free Reserve: {this.state.freeReserve}  Debt: {this.state.debt}, Contribution: {this.state.contribution}, Payout: {this.state.payout}
          </Alert>
          <h3>About stake contract</h3>
          <p>This stake contract holds tokens in reserve, from which users get a bonus reward.</p>
          <p>The bonus percentage applies to the amount of tokens, and time, locked in the contract.</p>
          <p>After the time lock expires, users can withdraw their deposit + reward bonus.</p>
          <p>Users can deposit and stake only if the contract has enough reserves for their deposit + bonus amount.</p>
          <p>Users can not withdraw a deposit before the time they choose to lock them, below</p>
          <p>Tech note: the owner of this contract can add more reserves, and can only withdraw remaining reserves not yet committed to users.</p>
          <p><a href="https://github.com/CoTraderCore/cot-stake-contract/blob/master/contracts/Stake.sol" target="_blank" rel="noopener noreferrer">link to source code</a></p>
          <p><a href={EtherscanLink + "address/" + StakeAddress} target="_blank" rel="noopener noreferrer">link to etherscan</a></p>
          <h3>Rewarding for stake</h3>
          <ul style={{"display":"inline-block"}}>
          <li>3 months - 3%</li>
          <li>6 months - 8%</li>
          <li>12 months - 20%</li>
          <li>24 months - 50%</li>
          <li>36 months - 100%</li>
          </ul>
          <br/>
          <h3>How to start</h3>
          <strong>Step 0</strong>
          <p>[Buy COT tokens] if you don't have any</p>
          <strong>Step 1</strong>
          <p>Approve some amount tokens to stake contract</p>
          <strong>Step 2</strong>
          <p>Deposit this amount, and select time</p>
          <strong>Step 3</strong>
          <p>When the necessary time passes, withdraw your deposit + profit</p>

          {
            this.state.isClientWeb3Connected
            ?
            (
              <ButtonGroup vertical={this.state.isMobileSize}>
                <Approve freeReserve={this.state.freeReserve} web3={this.state.web3} tokenContract={this.state.tokenContract} spender={StakeAddress} account={this.state.account[0]}/>
                <Deposit freeReserve={this.state.freeReserve} web3={this.state.web3}  stakeContract={this.state.stakeContract} account={this.state.account[0]}/>
                <Withdraw web3={this.state.web3} stakeContract={this.state.stakeContract} account={this.state.account[0]}/>
                <MyInfo web3={this.state.web3} stakeContract={this.state.stakeContract} account={this.state.account[0]}/>
              </ButtonGroup>
            )
            :
            (
              <Alert variant="info">To interact with the contract, please connect to web3 <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> for laptop or <a href="https://trustwallet.com/" target="_blank" rel="noopener noreferrer">TrustWallet</a> for mobile</Alert>
            )
          }


          </div>
          </Paper>
          </React.Fragment>
        )
        :
        (<p>Load data from smart contract...</p>)
      }

      </React.Fragment>
    )
  }
}

export default inject('MobXStorage')(Stake)

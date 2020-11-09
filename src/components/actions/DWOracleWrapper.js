// this component wrap Deposit and Withdarw buttons with require Oracle update
// before Deposit or withdarw

import React, { PureComponent } from 'react'
import { Button } from "react-bootstrap"
import {
  SmartFundABIV8,
  LinkToken,
  LinkFee,
  CoTraderConfigABI,
  CoTraderConfig,
  ERC20ABI,
  EtherscanLink
} from '../../config.js'
import Pending from '../templates/Spiners/Pending'
import { fromWei } from 'web3-utils'


class DWOracleWrapper extends PureComponent {
  constructor(props, context) {
    super(props, context)
    this.state = {
      DWFrezee:false,
      DWOpen:false,
      DWDate:null,
      DWUpdated:false,
      LatestOracleCaller:undefined,
      latestOracleCallOnTime:0,
      DWPending:false,
      AllowncePending:false,
      isDataLoaded:false,
      isEmptySharesFund:false
    }
  }

  componentDidMount(prevProps, prevState){
    setTimeout(async () => {
      // check link balance and allowance
      const {
        isEnoughLinkBalance,
        isEnoughLinkAllowance
      } = await this.checkLinkPayment()

      // get DW data
      const {
        DWFrezee,
        DWDate,
        DWOpen,
        LatestOracleCaller,
        latestOracleCallOnTime,
        isEmptySharesFund
      } = await this.getFundData()

      // update states
      this.setState({
        DWFrezee,
        DWDate,
        DWOpen,
        LatestOracleCaller,
        latestOracleCallOnTime,
        isEmptySharesFund,
        isEnoughLinkBalance,
        isEnoughLinkAllowance,
        isDataLoaded:true
      })
    },100)
  }

  componentWillUnmount(){
    if(this.state.intervalID !== 0){
      clearTimeout(this.state.intervalID)
      this.setState({ DWPending:false, AllowncePending:false })
    }
  }

  // Get Oracle fund data
  getFundData = async() => {
    const fund = new this.props.web3.eth.Contract(SmartFundABIV8, this.props.address)
    const config = new this.props.web3.eth.Contract(CoTraderConfigABI, CoTraderConfig)

    const LatestOracleCaller = await fund.methods.latestOracleCaller().call()
    const latestOracleCallOnTime = Number(await fund.methods.latestOracleCallOnTime().call())
    const DW_FREEZE_TIME = Number(await config.methods.DW_FREEZE_TIME().call())
    const TRADE_FREEZE_TIME = Number(await config.methods.TRADE_FREEZE_TIME().call())

    const now = Math.round((new Date()).getTime() / 1000)

    const DWFrezee = latestOracleCallOnTime + DW_FREEZE_TIME >= now ? true : false
    const DWOpen = latestOracleCallOnTime + TRADE_FREEZE_TIME >= now ? true : false
    const DWDate = new Date((latestOracleCallOnTime + DW_FREEZE_TIME) * 1000).toLocaleString()
    const totalShares = await fund.methods.totalShares().call()
    const isEmptySharesFund = totalShares > 0 ? false : true

    return {
      DWFrezee,
      DWDate,
      DWOpen,
      LatestOracleCaller,
      latestOracleCallOnTime,
      isEmptySharesFund
    }
  }

  // Check if user can pay Link commision
  checkLinkPayment = async () => {
    const LinkContract = new this.props.web3.eth.Contract(ERC20ABI, LinkToken)
    const UserLinkBalance = await LinkContract.methods.balanceOf(this.props.accounts[0]).call()
    const UserLinkAllowance = await LinkContract.methods.allowance(this.props.accounts[0], this.props.address).call()

    const isEnoughLinkBalance = parseFloat(fromWei(String(UserLinkBalance))) >= parseFloat(fromWei(String(LinkFee)))
    const isEnoughLinkAllowance = parseFloat(fromWei(String(UserLinkAllowance))) >= parseFloat(fromWei(String(LinkFee)))

    return { isEnoughLinkBalance, isEnoughLinkAllowance }
  }


 // Get Oracle data
  updateOracle = async () => {
    const fund = new this.props.web3.eth.Contract(SmartFundABIV8, this.props.address)
    // TODO get fee dynamicly
    fund.methods.updateFundValueFromOracle(LinkToken, LinkFee).send({ from:this.props.accounts[0] })
    .on('transactionHash', (hash) => {
      this.setState({ DWPending:true })
      this.runSenderCheckerInterval()
    })
  }

 // Oracle uppdate checker
  runSenderCheckerInterval = async () => {
    // clear prev interval
    if(this.state.intervalID !== 0)
       clearTimeout(this.state.intervalID)

    const {
      DWOpen,
      LatestOracleCaller,
      latestOracleCallOnTime,
      isEmptySharesFund
    } = await this.getFundData()

    if(latestOracleCallOnTime === this.state.latestOracleCallOnTime){
      // set new interval
      const intervalID = setTimeout(this.runSenderCheckerInterval, 4000)
      this.setState({ intervalID })
    }else{
      // update states
      this.setState({
        LatestOracleCaller,
        DWOpen,
        isEmptySharesFund,
        DWPending:false
      })
    }
  }

 // allowance checker
 runApproveCheckerInterval = async () => {
    // clear prev interval
    if(this.state.intervalID !== 0)
       clearTimeout(this.state.intervalID)

    const {
      isEnoughLinkAllowance
    } = await this.checkLinkPayment()

    console.log(isEnoughLinkAllowance)

    if(!isEnoughLinkAllowance){
      // set new interval
      const intervalID = setTimeout(this.runApproveCheckerInterval, 4000)
      this.setState({ intervalID })
    }
    else{
      // update states
      this.setState({
        isEnoughLinkAllowance,
        AllowncePending:false
      })
    }
  }

 // approve Link commision to fund
 approveLink = () => {
    const LinkContract = new this.props.web3.eth.Contract(ERC20ABI, LinkToken)
    LinkContract.methods.approve(this.props.address, LinkFee).send({ from:this.props.accounts[0] })
    .on('transactionHash', (hash) => {
      this.setState({ AllowncePending:true })
      this.runApproveCheckerInterval()
    })
  }

  // Render a certain action dependse of DW freeze time, oracle sender, Link balance and allowance
  renderAction(){
    if(this.state.isEmptySharesFund){
      return(
        <>
        {
          this.props.action
        }
        </>
      )
    }
    else if(this.state.DWOpen){
      if(String(this.state.LatestOracleCaller).toLowerCase() === String(this.props.accounts[0]).toLowerCase()){
        return(
          <>
          {
            this.props.action
          }
          </>
        )
      }else{
        return(
          <>
          <small>Next deposit will be able </small>
          { this.state.DWDate }
          </>
        )
      }
    }
    else if(this.state.DWFrezee){
      return(
        <>
        <small>Next deposit will be able </small>
        { this.state.DWDate }
        </>
      )
    }
    else{
      if(this.state.isEnoughLinkBalance && this.state.isEnoughLinkAllowance){
        return(
          <>
            <Button
              variant="outline-primary"
              onClick={() => this.updateOracle()}>
              Calculate my share
            </Button>
          </>
        )
      }else{
        return(
          <>
          {
            !this.state.isEnoughLinkBalance
            ?
            (
              <>
              Please buy - { fromWei(String(LinkFee)) }
              <a href={EtherscanLink + "token/" + LinkToken} target="_blank" rel="noopener noreferrer">Link token</a>
              </>
            )
            :
            (
              <>
              {
                !this.state.isEnoughLinkAllowance
                ?
                (
                  <>
                    <Button
                      variant="outline-primary"
                      onClick={() => this.approveLink()}>
                      Unlock Link
                    </Button>
                  </>
                )
                : null
              }
              </>
            )
          }
          </>
        )
      }
    }
  }


  // Html
  render() {
    return (
      <>
      {
        this.state.isDataLoaded
        ?
        (
          <>
          {
            this.renderAction()
          }
          </>
        )
        : <Pending/>
      }


      <br/>

      {
        this.state.DWPending
        ?
        (
          <>
          <small>Update shares, please wait and don't close page</small>
          <Pending/>
          </>
        )
        : null
      }

      {
        this.state.AllowncePending
        ?
        (
          <>
          <small>Approving Link, please wait and don't close page</small>
          <Pending/>
          </>
        )
        : null
      }
      </>
    )
  }

}

export default DWOracleWrapper

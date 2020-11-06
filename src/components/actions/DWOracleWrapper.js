// this component wrap Deposit and Withdarw buttons with require Oracle update
// before Deposit or withdarw

import React, { PureComponent } from 'react'
import { Button } from "react-bootstrap"
import {
  SmartFundABIV8,
  LinkToken,
  LinkFee,
  CoTraderConfigABI,
  CoTraderConfig
} from '../../config.js'
import Pending from '../templates/Spiners/Pending'


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
      pending:false,
      isDataLoaded:false
    }
  }

  componentDidMount(prevProps, prevState){
    setTimeout(async () => {
        // get data
        const {
          DWFrezee,
          DWDate,
          DWOpen,
          LatestOracleCaller,
          latestOracleCallOnTime
        } = await this.getFundData()

        // update states
        this.setState({
          DWFrezee,
          DWDate,
          DWOpen,
          LatestOracleCaller,
          latestOracleCallOnTime,
          isDataLoaded:true
        })
    },100)
  }

  componentWillUnmount(){
    if(this.state.intervalID !== 0){
      clearTimeout(this.state.intervalID)
      this.setState({ pending:false })
    }

  }

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

    return {
      DWFrezee,
      DWDate,
      DWOpen,
      LatestOracleCaller,
      latestOracleCallOnTime
    }
  }


  updateOracle = async () => {
    const fund = new this.props.web3.eth.Contract(SmartFundABIV8, this.props.address)
    // TODO get fee dynamicly
    fund.methods.updateFundValueFromOracle(LinkToken, LinkFee).send({ from:this.props.accounts[0] })
    .on('transactionHash', (hash) => {
      this.setState({ pending:true })
      this.runSenderCheckerInterval()
    })
  }

  runSenderCheckerInterval = async () => {
    // clear prev interval
    if(this.state.intervalID !== 0)
       clearTimeout(this.state.intervalID)

    const {
      DWOpen,
      LatestOracleCaller,
      latestOracleCallOnTime
    } = await this.getFundData()

    if(latestOracleCallOnTime === this.state.latestOracleCallOnTime){
      // set new interval
      const intervalID = setTimeout(this.runSenderCheckerInterval, 4000)
      this.setState({ intervalID })
    }else{
      // update states
      this.setState({ LatestOracleCaller, DWOpen, pending:false })
    }
  }

  render() {
    return (
      <>
      {
        this.state.isDataLoaded
        ?
        (
          <>
          {
            String(this.state.LatestOracleCaller).toLowerCase() === String(this.props.accounts[0]).toLowerCase()
            ?
            (
              <>
              {
                this.state.DWOpen
                ?
                (
                  <>
                  {
                    this.props.action
                  }
                  </>
                )
                :
                (
                  <>
                  <p>Time expired please update again</p>
                    <Button
                      variant="outline-primary"
                      onClick={() => this.updateOracle()}>
                      Calculate my share
                    </Button>
                  </>
                )
              }
              </>
            )
            :
            (
              <>
              {
                !this.state.DWFrezee
                ?
                (
                  <Button
                    variant="outline-primary"
                    onClick={() => this.updateOracle()}>
                    Calculate my share
                  </Button>
                )
                :
                (
                  <>
                  <small>Next deposit will be able </small>
                  { this.state.DWDate }
                  </>
                )
              }
              </>
            )
          }
          </>
        )
        :
        null
      }


      <br/>

      {
        this.state.pending
        ?
        (
          <>
          <small>Update shares, please wait and don't close page</small>
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

import React, { PureComponent } from 'react'
import {
  SmartFundABIV8,
  CoTraderConfigABI,
  CoTraderConfig
} from '../../config.js'
import { Alert } from "react-bootstrap"


class TradeFreezeWarning extends PureComponent {
  state = {
    isCloseTrade:false,
    intervalID:0
  }

  componentDidMount(prevProps, prevState){
    setTimeout(async () => {
      const { isCloseTrade, OpenDate } = await this.checkTradeStatus()
      this.setState({ isCloseTrade, OpenDate })

      // run interval checker
      this.runCheckTradeOpenInterval()
    }
  ,100)
  }

  componentWillUnmount(){
    if(this.state.intervalID !== 0)
      clearTimeout(this.state.intervalID)
  }

  // Get Oracle fund data
  checkTradeStatus = async() => {
    const fund = new this.props.web3.eth.Contract(SmartFundABIV8, this.props.smartFundAddress)
    const config = new this.props.web3.eth.Contract(CoTraderConfigABI, CoTraderConfig)
    const latestOracleCallOnTime = Number(await fund.methods.latestOracleCallOnTime().call())
    const TRADE_FREEZE_TIME = Number(await config.methods.TRADE_FREEZE_TIME().call())
    const now = Math.round((new Date()).getTime() / 1000)
    const OpenDate = new Date((latestOracleCallOnTime + TRADE_FREEZE_TIME) * 1000).toLocaleString()
    const isCloseTrade = latestOracleCallOnTime + TRADE_FREEZE_TIME >= now

    return { isCloseTrade, OpenDate }
  }


  // check if Trade open each 3 seconds
  runCheckTradeOpenInterval = async () => {
    // clear prev interval
    if(this.state.intervalID !== 0)
       clearTimeout(this.state.intervalID)
    // get latest data
    const { isCloseTrade, OpenDate }  = await this.checkTradeStatus()
    console.log("Interval isCloseTrade", isCloseTrade)
    // set new interval
    const intervalID = setTimeout(this.runCheckTradeOpenInterval, 5000)
    // update states
    this.setState({ isCloseTrade, OpenDate, intervalID })
  }

  render() {
    return (
      <>
      {
        this.state.isCloseTrade
        ?
        (
          <Alert variant="danger">
          <strong>WARNING: Transaction will be throw</strong>
          <hr/>
          <small>Details: this fund require freeze for update fund value from Oracle,
          next transaction will be able {this.state.OpenDate}</small>
          </Alert>
        )
        : null
      }
      </>
    )
  }

}

export default TradeFreezeWarning

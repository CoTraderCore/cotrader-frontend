// TODO refactoring with spred

import React from 'react'
import LineChart from './containers/LineChart'
import Loading from '../templates/Spiners/Loading'
import axios from 'axios'
import { Col, Row } from "react-bootstrap"

const BloxyChartsLink = `https://api.bloxy.info/widget/address_value_daily?price_currency=ETH&key=${process.env.REACT_APP_BLOXY_KEY}&address=`



class ViewPageCharts extends React.Component {
  constructor(props){
    super(props)
    this.state = {
    DWdata: {
    labels: [],
    datasets: []
    },
    unrealizedGainsData: {
    labels: [],
    datasets: []
    },
    totalGainsData: {
    labels: [],
    datasets: []
    },
    realizedGainsData: {
    labels: [],
    datasets: []
    },
    ROIdata: {
    labels: [],
    datasets: []
    },
    ROIDAILYdata: {
    labels: [],
    datasets: []
    },
    PROFITdata: {
    labels: [],
    datasets: []
    },
    DAILYVALUEdata: {
    labels: [],
    datasets: []
    },
    isDataLoad: false,
    reciveddata: null
  }
  }

  _isMounted = false

  componentDidMount = async () => {
    this._isMounted = true
    await this.updateChartsData()
  }

  componentWillUnmount(){
    this._isMounted = false
  }

  componentDidUpdate = async (nextProps) => {
  if(nextProps.Data !== this.props.Data){
    await this.updateChartsData()
    }
  }

  updateChartsData = async () => {
    axios.get(BloxyChartsLink + this.props.address).then((data) => {
    if(this._isMounted){
    const date = data.data.map(function(v) {
      return v.date
    });

    const deposit_value = data.data.map(function(v) {
      return v.deposit_value
    });

    const withdraw_value = data.data.map(function(v) {
      return -v.withdraw_value
    });

    const profit = data.data.map(function(v) {
      return v.profit
    });

    const roi = data.data.map(function(v) {
      return v.profit / v.deposited
    });

    const roiDaily = data.data.map(function(v) {
      return v.roi_daily
    });

    const daylyValue = data.data.map(function(v) {
      return v.daily_value
    });

    const realizedGains = data.data.map(function(v) {
      const withdraw_value = v.deposit_value + v.daily_value
      return v.withdraw_value - withdraw_value
    });

    const unrealizedGains = data.data.map(function(v) {
      const depositSubWithdraw = v.deposit_value - v.withdraw_value
      return v.daily_value - depositSubWithdraw
    });

    const totalGains = data.data.map(function(v) {
      const depositSubWithdraw = v.deposit_value - v.withdraw_value
      const UnrealizedGains = v.daily_value - depositSubWithdraw
      const withdraw_value = v.deposit_value + v.daily_value
      const RealizedGains = v.withdraw_value - withdraw_value
      return RealizedGains + UnrealizedGains
    });

    const parsedDWdata = {
      labels:date,
      datasets: [{
      label: 'Deposit',
      backgroundColor: 'rgba(75,192,192,0.4)',
      fill: false,
      lineTension: 0.1,
      borderColor: 'rgba(75,192,192,1)',
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0.0,
      borderJoinStyle: 'miter',
      pointBorderColor: 'rgba(75,192,192,1)',
      pointBackgroundColor: '#fff',
      pointBorderWidth: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: 'rgba(75,192,192,1)',
      pointHoverBorderColor: 'rgba(220,220,220,1)',
      pointHoverBorderWidth: 2,
      pointRadius: 1,
      pointHitRadius: 10,
      data: deposit_value
    },
    {
      label: 'Withdraw',
      fill: true,
      lineTension: 0.1,
      backgroundColor: 'rgba(219,112,147, 0.4)',
      borderColor: 'rgba(219,112,147)',
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0.0,
      borderJoinStyle: 'miter',
      pointBorderColor: 'rgba(219,112,147)',
      pointBackgroundColor: '#fff',
      pointBorderWidth: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: 'rgba(219,112,147)',
      pointHoverBorderColor: 'rgba(220,220,220,1)',
      pointHoverBorderWidth: 2,
      pointRadius: 1,
      pointHitRadius: 10,
      data: withdraw_value
    }
      ]
    }
    const parsedRealizedGains = {
      labels:date,
      datasets: [
        {
          label: 'Realized gains',
          backgroundColor: 'rgba(18,237,20, 0.4)',
          fill: false,
          lineTension: 0.1,
          borderColor: 'rgba(18,237,20)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(18,237,20)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(18,237,20)',
          pointHoverBorderColor: 'rgba(18,237,20)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: realizedGains
        }
      ]
    }

    const parsedUnrealizedGains = {
      labels:date,
      datasets: [
        {
          label: 'Unrealized gains',
          backgroundColor: 'rgba(229,222,19, 0.4)',
          fill: false,
          lineTension: 0.1,
          borderColor: 'rgba(229,222,19)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(229,222,19)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(229,222,19)',
          pointHoverBorderColor: 'rgba(229,222,19)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: unrealizedGains
        }
      ]
    }

    const parsedROIdata = {
      labels:date,
      datasets: [
        {
          label: 'ROI',
          backgroundColor: 'rgba(135,206,250, 0.4)',
          fill: false,
          lineTension: 0.1,
          borderColor: 'rgba(135,206,250)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(135,206,250)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(135,206,250)',
          pointHoverBorderColor: 'rgba(135,206,250)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: roi
        }
      ]
    }

    const parsedPROFITdata = {
      labels:date,
      datasets: [
        {
          label: 'Profit',
          backgroundColor: 'rgba(95,158,160, 0.4)',
          fill: false,
          lineTension: 0.1,
          borderColor: 'rgba(95,158,160)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(95,158,160)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(95,158,160)',
          pointHoverBorderColor: 'rgba(95,158,160)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: profit
        }
      ]
    }

    const parsedDAILYVALUEdata = {
      labels:date,
      datasets: [
        {
          label: 'Daily Value',
          backgroundColor: 'rgba(138,43,226, 0.4)',
          fill: false,
          lineTension: 0.1,
          borderColor: 'rgba(138,43,226)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(138,43,226)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(138,43,226)',
          pointHoverBorderColor: 'rgba(138,43,226)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: daylyValue
        }
      ]
    }

    const parsedTotalGains = {
      labels:date,
      datasets: [
        {
          label: 'Total gains',
          backgroundColor: 'rgba(237, 104, 9, 0.4)',
          fill: false,
          lineTension: 0.1,
          borderColor: 'rgba(237, 104, 9)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(237, 104, 9)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(237, 104, 9)',
          pointHoverBorderColor: 'rgba(237, 104, 9)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: totalGains
        }
      ]
    }

    const parsedRoiDaily = {
      labels:date,
      datasets: [
        {
          label: 'ROI Daily',
          backgroundColor: 'rgba(240, 26, 144, 0.4)',
          fill: false,
          lineTension: 0.1,
          borderColor: 'rgba(240, 26, 144)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(240, 26, 144)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(240, 26, 144)',
          pointHoverBorderColor: 'rgba(240, 26, 144)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: roiDaily
        }
      ]
    }

    if(this._isMounted)
    this.setState({
      DWdata: parsedDWdata,
      unrealizedGainsData:parsedUnrealizedGains,
      realizedGainsData:parsedRealizedGains,
      ROIdata: parsedROIdata,
      PROFITdata: parsedPROFITdata,
      DAILYVALUEdata: parsedDAILYVALUEdata,
      totalGainsData:parsedTotalGains,
      ROIDAILYdata:parsedRoiDaily,
      isDataLoad: true
    })
  }
  })
  }

  render(){
  return(
    <div>
    {
      this.state.isDataLoad
      ?
      (
      <React.Fragment>
      {
        this.state.DWdata.labels.length > 0
        ?
        (
          <React.Fragment>
          <Row>
          <Col>
          <Row>
          <Col>
          <LineChart data={this.state.totalGainsData} />
          </Col>
          <Col>
          <LineChart data={this.state.unrealizedGainsData} />
          </Col>
          <Col>
          <LineChart data={this.state.realizedGainsData} />
          </Col>
          <Col>
          <LineChart data={this.state.ROIDAILYdata} />
          </Col>
          </Row>
          </Col>
          <Col>
          <Row>
          <Col>
          <LineChart data={this.state.DWdata} />
          </Col>
          <Col>
          <LineChart data={this.state.ROIdata}/>
          </Col>
          <Col>
          <LineChart data={this.state.PROFITdata} />
          </Col>
          <Col>
          <LineChart data={this.state.DAILYVALUEdata} />
          </Col>
          </Row>
          </Col>
          </Row>
          </React.Fragment>
        )
        :
        (
          <Row>
          <Col>
          <strong>"No activity"</strong>
          </Col>
          </Row>
        )
      }
      </React.Fragment>
      )
      :
      (
        <Row>
        <Col>
        <Loading />
        <small>Loading charts data</small>
        </Col>
        </Row>
      )
    }

    </div>
  )
}


}

export default ViewPageCharts

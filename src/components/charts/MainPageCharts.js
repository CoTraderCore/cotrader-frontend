// TODO refactoring with spred

import React from 'react'

import LineChart from './containers/LineChart'

import Loading from '../templates/Spiners/Loading'
import axios from 'axios'
import { Col, Row } from "react-bootstrap"

const BloxyChartsLink = `https://api.bloxy.info/widget/address_value_daily?price_currency=ETH&key=${process.env.REACT_APP_BLOXY_KEY}&address=`

class MainPageCharts extends React.Component {
  constructor(props){
    super(props)
    this.state = {
    DWdata: {
    labels: [],
    datasets: []
    },
    ROIdata: {
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

    axios.get(BloxyChartsLink + this.props.address).then((data) => {
    if(this._isMounted){
    console.log(data)
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

    const daylyValue = data.data.map(function(v) {
      return v.daily_value
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

    this.setState({
      DWdata: parsedDWdata,
      ROIdata: parsedROIdata,
      PROFITdata: parsedPROFITdata,
      DAILYVALUEdata: parsedDAILYVALUEdata,
      isDataLoad: true
    })
  }
  })

  }

  componentWillUnmount(){
    this._isMounted = false
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
        )
        :
        (
          <Row>
          <Col>
          <strong>"No activity"</strong>
          </Col>
          <Col>
          <strong>"No activity"</strong>
          </Col>
          <Col>
          <strong>"No activity"</strong>
          </Col>
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
        <small>Loading Deposit/Withdtaw chart</small>
        </Col>
        <Col>
        <Loading />
        <small>Loading ROI chart</small>
        </Col>
        <Col>
        <Loading />
        <small>Loading Profit charts</small>
        </Col>
        <Col>
        <Loading />
        <small>Loading Daily Value chart</small>
        </Col>
        </Row>
      )
    }

    </div>
  )
}


}

export default MainPageCharts

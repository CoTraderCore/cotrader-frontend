import React from 'react'
import { Pie } from 'react-chartjs-2'
import { fromWei, toWei } from 'web3-utils'
import { Badge } from "react-bootstrap"
import { IExchangePortalABI, ExchangePortalAddress, ExchangePortalAddressV6 } from '../../config.js'
import { inject } from 'mobx-react'
import defaultWeb3 from '../../utils/defaultWeb3'

class AssetsAlocationChart extends React.Component{
  constructor(props, context) {
    super(props, context)
    this.state = {
      data:{
        labels: [],
        datasets: []
      },
      eth_token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    }
  }

  _isMounted = false

  componentDidMount = async () => {
    this._isMounted = true
    await this.updateAssetsData()
  }

  componentWillUnmount(){
    this._isMounted = false
  }

  componentDidUpdate = async (nextProps) => {
  if(nextProps.AssetsData !== this.props.AssetsData){
    await this.updateAssetsData()
    }
  }

  updateAssetsData = async () => {
    const AssetsData = this.props.AssetsData

    if(AssetsData){
    let labels = AssetsData.map(item => {
      return item["balance"] > 0 && item["symbol"]
    })

    let balance = await Promise.all(AssetsData.map(item => {
      return item["balance"] > 0 && this.RateToETH(item["address"], fromWei(String(item["balance"])))
    }))

    labels = labels.filter(function (el) {
    return el;
    })

    balance = balance.filter(function (el) {
    return el;
    })

    if(this._isMounted)
    this.setState({
      data:{
        labels:labels,
        datasets: [{
	    	data: balance,
        hoverBorderWidth:2,
        hoverBorderColor:'rgba(63, 81, 181, 0.8)',
	    	backgroundColor: [
          '#36A2EB',
          '#00f5d1',
          "#4251b0",
          "#50119e",
          "#10cdeb",
          "#00c0aa",
          "#8b25d2",
          "#8b25d3",
          "#10creb",
          "#30creb",
          '#37U3EB',
          '#02d5e1',
          "#441180",
          "#00411e",
          "#135d4b",
          '#36A2EB',
          '#00f5d1',
          "#4251b0",
          "#50119e",
          "#10cdeb",
          "#00c0aa"
	    	],
	    	hoverBackgroundColor: [
          '#36A2EB',
          '#00f5d1',
          "#4251b0",
          "#50119e",
          "#10cdeb",
          "#00c0aa",
          "#8b25d2",
          "#8b25d3",
          "#10creb",
          "#30creb",
          '#37U3EB',
          '#02d5e1',
          "#441180",
          "#00411e",
          "#135d4b",
          '#36A2EB',
          '#00f5d1',
          "#4251b0",
          "#50119e",
          "#10cdeb",
          "#00c0aa"
	    	]
	    }]
      }
    })
  }
  }

  getTokenWeiByDecimals = async () => {

  }

  RateToETH = async (from, amount) => {
    const web3 = this.props.MobXStorage.web3 ? this.props.MobXStorage.web3 : defaultWeb3
    if(from === this.state.eth_token){
      return amount
    }
    else{
      let value
      if(this.props.version === 1){
        const contract = new web3.eth.Contract(IExchangePortalABI, ExchangePortalAddress)
        const src = toWei(String(amount), 'ether')
        value = await contract.methods.getValue(from, this.state.eth_token, src).call()
      }
      else{
        const contract = new web3.eth.Contract(IExchangePortalABI, ExchangePortalAddressV6)
        const src = toWei(String(amount), 'ether')
        value = await contract.methods.getValue(from, this.state.eth_token, src).call()
      }

      return fromWei(String(value))
    }
  }

  render() {
    return (
      <React.Fragment>
      {
        this.state.data.labels.length > 0
        ?
        (
          <div style={{ width: 320, height: 220}}>
            <Badge>Asset allocation in ETH value</Badge>
            <Pie data={this.state.data} />
          </div>
        )
        :(null)
      }
      </React.Fragment>
    )
  }
}

export default inject('MobXStorage')(AssetsAlocationChart)

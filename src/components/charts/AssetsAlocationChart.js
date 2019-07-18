import React from 'react'
import { Pie } from 'react-chartjs-2'
import { fromWei, toWei, hexToNumberString } from 'web3-utils'
import { Badge } from "react-bootstrap"
import { KyberInterfaceABI, KyberAddress } from '../../config.js'
import { inject } from 'mobx-react'

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
      return item["balance"] > 0 && this.kyberRateToETH(item["address"], fromWei(item["balance"].toString()))
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
	    	backgroundColor: [
	    	'#36A2EB',
	    	'#FFCE56',
        "#808000",
        "#ff00ff",
        "#00ffff",
        "#00ff00",
        "#ffff00"
	    	],
	    	hoverBackgroundColor: [
	    	'#36A2EB',
	    	'#FFCE56',
        "#808000",
        "#ff00ff",
        "#00ffff",
        "#00ff00",
        "#ffff00"
	    	]
	    }]
      }
    })
  }
  }

  kyberRateToETH = async (from, amount) => {
    if(from === this.state.eth_token){
      return amount
    }
    else{
      const contract = new this.props.MobXStorage.web3.eth.Contract(KyberInterfaceABI, KyberAddress)
      const src = toWei(amount.toString(), 'ether')
      const value = await contract.methods.getExpectedRate(from, this.state.eth_token,src).call()
      const result = hexToNumberString(value.expectedRate._hex)
      return fromWei(result.toString())
    }
  }

  render() {
    return (
      <React.Fragment>
      {
        this.state.data.labels.length > 0
        ?
        (
          <div style={{ width: 360, height: 280, marginLeft: "auto", marginRight: "auto" }}>
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

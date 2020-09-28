import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Badge } from "react-bootstrap"

class InvestorsAlocationChart extends React.Component{
  constructor(props, context) {
    super(props, context)
    this.state = {
      data:{
        labels: [],
        datasets: []
      }
    }
  }

  _isMounted = false

  componentDidMount = async() => {
    this._isMounted = true
    setTimeout(async () => {
      await this.updateInvestorsData()
    }, 1000)
  }

  componentWillUnmount(){
    this._isMounted = false
  }

  componentDidUpdate = async (nextProps) => {
  if(nextProps.Data !== this.props.Data){
    await this.updateInvestorsData()
    }
  }

  updateInvestorsData = async () => {
    const Data = JSON.parse(this.props.Data)

    if(Data){
    let labels = Data.map(item => {
     return item["shares"] > 0 && item["user"].slice(0, -31) + '...'
    })

    let balance = Data.map(item => {
      return item["shares"] > 0 && item["shares"]
    })

    labels = labels.filter(function (el) {
    return el;
    })

    balance = balance.filter(function (el) {
    return el;
    })

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
        "#8b25d2"
        ],
        hoverBackgroundColor: [
        '#36A2EB',
        '#00f5d1',
        "#4251b0",
        "#50119e",
        "#10cdeb",
        "#00c0aa",
        "#8b25d2"
        ]
      }]
    }
    })
  }
  }

  render() {
    return (
      <React.Fragment>
      {
        this.state.data.labels.length > 0 ?
        (
          <div style={{ width: 320, height: 220 }}>
            <Badge>Investors shares</Badge>
            <Pie data={this.state.data} />
          </div>
        )
        :
        (
          null
        )
      }
      </React.Fragment>
    )
  }
}

export default InvestorsAlocationChart

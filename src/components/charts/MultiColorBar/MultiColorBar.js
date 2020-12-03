import React, { Component } from 'react';
import MultiColorContainer from './MultiColorContainer'


class MultiColorBar extends Component {
  state = {
    propsData:[],
    totalPercent:0
  }

  componentDidMount(){
    setTimeout(() => {
      const propsData = []

      this.props.data.forEach(obj => {
        if(Number(obj.percentInETH).toFixed() > 0)
        propsData.push(
          {name:obj.symbol, value:Number(obj.percentInETH).toFixed(), color: "#" + Math.floor(Math.random()*16777215).toString(16)}
        )
      })

      const totalPercent = propsData.map(item => item.value).reduce((a, b) => Number(a) + Number(b), 0)

      this.setState({
        propsData,
        totalPercent
      })
    },1000)

  }

  render() {
    return (
      <>
      {
        this.state.propsData.length > 0 && this.state.totalPercent <= 100
        ?
        (
          <MultiColorContainer readings={this.state.propsData} />
        )
        : null
      }
      </>
    )
  }

}

export default MultiColorBar

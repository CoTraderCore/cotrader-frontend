import React, { Component } from 'react'
import { Button } from "react-bootstrap"

class Withdraw extends Component{
  Withdarw = () => {
  this.props.stakeContract.methods.withdraw().send({ from:this.props.account })
  }

  render(){
    return(
    <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.Withdarw()}>
      Withdraw
    </Button>
  )
}
}

export default Withdraw

import React, { PureComponent } from 'react'
import { Button } from "react-bootstrap"
import { SmartFundABIV8, LinkToken, LinkFee } from '../../config.js'

class UpdateOracleValue extends PureComponent {

  updateOracle = async () => {
    const fund = new this.props.web3.eth.Contract(SmartFundABIV8, this.props.address)
    // TODO get fee dynamicly 
    fund.methods.updateFundValueFromOracle(LinkToken, LinkFee).send({ from:this.props.accounts[0] })
  }

  render() {
    return (
      <Button
      variant="outline-primary"
      onClick={() => this.updateOracle()}>
      Calculate my share
      </Button>
    )
  }

}

export default UpdateOracleValue

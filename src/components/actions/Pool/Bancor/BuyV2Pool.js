// Buy by connectors amount
// get all connectors by selected token

import React, { PureComponent } from 'react'
import { Form, Button, Alert } from "react-bootstrap"
import {
  PoolPortalV6,
  PoolPortalABIV7,
  SmartFundABIV7,
  BancorConverterABI,
  ERC20ABI,
  EtherscanLink
} from '../../../../config.js'


class BuyV2Pool extends PureComponent {
  getConnectorsByPoolAddress = async (address) => {

  }

  render() {
    console.log(this.props.tokensObject)
    return (
      <div>BuyV2Pool test</div>
    )
  }

}

export default BuyV2Pool

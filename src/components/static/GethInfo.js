import React, { Component } from 'react'
import { Alert } from "react-bootstrap"
import Web3 from "web3"

class GethInfo extends Component {

  state = {
    isSyncing:false
  }

  componentDidMount = () => {
    setTimeout(async () => {
      let isSyncing = false
      try{
        const provider = new Web3.providers.HttpProvider(process.env.REACT_APP_INFURA)
        const web3 = new Web3(provider)
        isSyncing = await web3.eth.isSyncing()
      }catch(e){
        isSyncing = true
        console.log("Check geth status e", e)
      }

      this.setState({ isSyncing })
    }, 1000)
  }

  render() {
    return (
      <div>
      {
        this.state.isSyncing
        ?
        (
          <Alert variant="warning" align="center">
          Synchronizing with the Ethereum node, please try later ...
          </Alert>
        ): null
      }
      </div>
    )
  }

}

export default GethInfo

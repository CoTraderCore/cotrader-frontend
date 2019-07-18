import React, { Component } from 'react'
import { Button, Modal} from "react-bootstrap"

class MyInfo extends Component{
  constructor(props, context) {
    super(props, context);

    this.state = {
      Show: false,
      Status:false,
      HoldTime: 0,
      StartTime: 0,
      EndTime: 0,
      DepositAmount:0,
      DepositWithPercent:0,
      isLoadData: false
    }
  }

  _isMounted = false
  componentDidMount = async() =>{
    this._isMounted = true
    const data = await this.props.stakeContract.methods.userDataMap(this.props.account).call()
    const Status = data.depositStatus

    const DepositAmount = Number(this.props.web3.utils.fromWei(String(this.props.web3.utils.hexToNumberString(data.amount._hex))))

    let HoldTime = Number(this.props.web3.utils.hexToNumberString(data.holdTime._hex))
    let EndTime = Number(this.props.web3.utils.hexToNumberString(data.endTime._hex))
    let StartTime = EndTime - HoldTime

    let DepositWithPercent = await this.props.stakeContract.methods.calculateWithdarw(this.props.web3.utils.toWei(String(DepositAmount)), HoldTime).call()
    DepositWithPercent = Number(this.props.web3.utils.fromWei(String(this.props.web3.utils.hexToNumberString(DepositWithPercent._hex))))

    // Don't change order
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    StartTime = new Date(StartTime * 1000).toLocaleDateString("en-US", options)
    HoldTime = HoldTime / 86400 // formula to find days just div seconds by 86400
    EndTime = new Date(EndTime * 1000).toLocaleDateString("en-US", options)


    if(this._isMounted)
    this.setState({
      Status,
      DepositAmount,
      DepositWithPercent,
      HoldTime,
      EndTime,
      StartTime
    })
  }

  componentWillUnmount(){
    this._isMounted = false
  }

  render(){
    let modalClose = () => this.setState({ Show: false });
    return(
    <React.Fragment>
    <Button variant="outline-primary" className="buttonsAdditional" onClick={() => this.setState({ Show: true })}>
      MyInfo
    </Button>

    <Modal
      show={this.state.Show}
      onHide={modalClose}
      aria-labelledby="example-modal-sizes-title-sm"
    >
      <Modal.Header closeButton>
      <Modal.Title id="example-modal-sizes-title-sm">
      <small>My Info</small>
      </Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <React.Fragment>
      {
        this.state.Status
        ?
        (
          <div>
          <p>Amount deposited: {this.state.DepositAmount}</p>
          <p>Start Date: {this.state.StartTime } </p>
          <p>Time locked in days: {this.state.HoldTime}</p>
          <p>End Date: {this.state.EndTime}</p>
          <p>Bonus waiting: {this.state.DepositWithPercent - this.state.DepositAmount}</p>
          <p>Total: {this.state.DepositWithPercent} </p>
          </div>
        )
        :
        (
          <p>You do not have a deposit</p>
        )
      }

      </React.Fragment>
     </Modal.Body>
   </Modal>
</React.Fragment>
  )
}
}

export default MyInfo

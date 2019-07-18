import React, { Component } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { EtherscanLink }  from '../../config.js'
import "react-toastify/dist/ReactToastify.css"
import { isAddress } from 'web3-utils'

// {EtherscanLink+"/tx/"+props.txHash}
const HashLink = (props) => {
 let link = ''
 if(isAddress){
   link = EtherscanLink+ "/address/" +props.txHash
 }else{
   link = EtherscanLink+ "/tx/" +props.txHash
 }

 return (
   <React.Fragment>
   <p>Tx {props.txName} done</p>
   <a style={{ "color": "white" }} href={link} target="_blank" rel="noopener noreferrer">
   view
   </a>
   </React.Fragment>
 )
}

class PopupMsg extends Component {
    show(){
        toast.info(<HashLink txName={this.props.txName} txHash={this.props.txHash}/>, {
        position: toast.POSITION.BOTTOM_RIGTH
      })
    }

    render(){
      return (
        <div>
          <ToastContainer />
        </div>
      );
    }
  }

export default PopupMsg

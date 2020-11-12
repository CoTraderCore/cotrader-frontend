/*Temporary*/
import React from 'react'
import { Modal } from "react-bootstrap"

function DEXExplanation(props) {
  const handleClose = () => props.setDEXModal(false);
  return (
    <>
    <Modal show={props.show} onHide={handleClose}>
      <Modal.Header closeButton >
      </Modal.Header>
      <Modal.Body>For v1 smart funds we use only  Kyber
      <hr/>
      For v2 and newest versions of smart funds we use ParaSwap and 1inch DEXs aggregators to split trades to get the better prices from Uniswap, Kyber, Bancor, Oasis, Balancer
      </Modal.Body>
    </Modal>
    </>
  );
}


export default DEXExplanation

/*Temporary*/
import React from 'react'
import { Modal } from "react-bootstrap"

function KyberExplainModal(props) {
  const handleClose = () => props.setKyberModal(false);
  return (
    <>
    <Modal show={props.show} onHide={handleClose}>
      <Modal.Header closeButton >
      </Modal.Header>
      <Modal.Body>For v1 smart funds we use only  Kyber
      <hr/>
      For v2 smart funds we use ParaSwap DEX aggregator to split trades to get the better prices from Uniswap, Kyber, Bancor, and Oasis
      </Modal.Body>
    </Modal>
    </>
  );
}


export default KyberExplainModal

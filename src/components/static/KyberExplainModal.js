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
      <Modal.Body>CoTrader smart funds currently use Kyber. We are about to add support for any and all dapps</Modal.Body>
    </Modal>
    </>
  );
}


export default KyberExplainModal

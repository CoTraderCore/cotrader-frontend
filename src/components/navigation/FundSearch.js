import React, { Component } from 'react'
import { Form, Button, Modal, InputGroup } from "react-bootstrap"
import { inject, observer } from 'mobx-react'
import { toWei } from 'web3-utils'
import { fromWei } from 'web3-utils'

class FundSearch extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      searchByName: '',
      searchByManager: '',
      searchByValue: 0,
      Show: false
    }
  }

  change = e => {
    this.setState({
      [e.target.name]: (e.target.name === 'searchByValue' && e.target.value > 0) ? toWei(e.target.value) : e.target.value
    })
  }

  Filter(param) {
    if(param === 1){
      this.props.MobXStorage.searchFund(this.state.searchByName)
    }
    else if(param === 2){
      this.props.MobXStorage.searchFundByManager(this.state.searchByManager)
    }

    else if(param === 3){
      this.props.MobXStorage.searchFundByValue(this.state.searchByValue)
    }
    else if(param === 4){
      // Reset filter
      this.props.MobXStorage.AllFunds()
      this.setState({ searchByName: '', searchByManager: '', searchByValue: 0})

    }
    else{
      console.log("Unknown type filter")
    }

    this.setState({ Show: false })
  }


  render(){
    let modalClose = () => this.setState({ Show: false })

    return(
      <React.Fragment>
      <Button style={{minWidth: "142px", maxWidth: "142px"}} variant="outline-primary" onClick={() => this.setState({ Show: true })}>
      Filter funds
      </Button>

      <Modal
        show={this.state.Show}
        onHide={modalClose}
        aria-labelledby="example-modal-sizes-title-sm"
      >
        <Modal.Header closeButton>
        <Modal.Title id="example-modal-sizes-title-sm">
        Filter smart funds
        </Modal.Title>
        </Modal.Header>
        <Modal.Body>
      <Form>

      <Form.Group>
      <InputGroup>
      <Form.Control placeholder="Find fund by name" value={this.state.searchByName} name="searchByName" onChange={e => this.change(e)}/>
      <InputGroup.Prepend>
      <Button variant="outline-primary" onClick={() => this.Filter(1)}>Find</Button>
      </InputGroup.Prepend>
      </InputGroup>
      </Form.Group>


      <Form.Group>
      <InputGroup>
      <Form.Control placeholder="Find fund by manager address"  value={this.state.searchByManager} name="searchByManager" onChange={e => this.change(e)}/>
      <InputGroup.Prepend>
      <Button variant="outline-primary" onClick={() => this.Filter(2)}>Find</Button>
      </InputGroup.Prepend>
      </InputGroup>
      </Form.Group>

      <Form.Group>
      <InputGroup>
      <Form.Control
      placeholder="Find fund by min value"
      type="number"
      name="searchByValue"
      value={this.state.searchByValue > 0 ? fromWei(this.state.searchByValue.toString()): 0}
      onChange={e => this.change(e)}/>
      <InputGroup.Prepend>
      <Button variant="outline-primary" onClick={() => this.Filter(3)}>Find</Button>
      </InputGroup.Prepend>
      </InputGroup>
      <Form.Text className="text-muted">
      Value greater or equal to (in wei): {this.state.searchByValue}
      </Form.Text>
      </Form.Group>

      </Form>
      <Button variant="outline-primary" onClick={() => this.Filter(4)}>Reset filters</Button>
      </Modal.Body>
    </Modal>


    </React.Fragment>
    )
  }
}

export default inject('MobXStorage')(observer(FundSearch));

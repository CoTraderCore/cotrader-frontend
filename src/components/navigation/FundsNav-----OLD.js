import React, { Component } from 'react'
import { Nav, OverlayTrigger, Tooltip } from "react-bootstrap"
import { inject, observer } from 'mobx-react'

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
});

class FundsNav extends Component {
 render(){

   const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

    return(

      <Paper className={classes.root}>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        centered
      >
        <Tab label="Item One" />
        <Tab label="Item Two" />
        <Tab label="Item Three" />
      </Tabs>
    </Paper>

    
      <Nav className="justify-content-center" variant="tabs">
      <Nav.Item>
      <Nav.Link onClick={() => this.props.MobXStorage.AllFunds()}>All funds</Nav.Link>
      </Nav.Item>
      <Nav.Item>
      {
        this.props.MobXStorage.web3
        ?
        (
          <Nav.Link onClick={() => this.props.MobXStorage.myFunds(this.props.MobXStorage.account[0])}>My funds</Nav.Link>
        )
        :
        (
        <OverlayTrigger
          overlay={
          <Tooltip>
          Please connect to web3
          </Tooltip>
          }
          >
          <Nav.Link>My funds</Nav.Link>
          </OverlayTrigger>
        )
      }

      </Nav.Item>
      {
        this.props.MobXStorage.web3 ?
        (
          <Nav.Link onClick={() => this.props.MobXStorage.myInvestments(this.props.MobXStorage.account[0])}>My investments</Nav.Link>
        )
        :
        (
          <OverlayTrigger
          overlay={
          <Tooltip>
          Please connect to web3
          </Tooltip>
          }
          >
          <Nav.Link>My investments</Nav.Link>
          </OverlayTrigger>
        )
      }
      </Nav>
    )
  }
}
export default inject('MobXStorage')(observer(FundsNav));

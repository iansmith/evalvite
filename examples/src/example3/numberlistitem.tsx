import {Col, Row} from "react-bootstrap";
import React, {ChangeEvent} from 'react';
import ev from 'evalvite';

import {NumberModelItem, NumberStateItem} from './models';

interface NumberPropsItem {
  model: NumberModelItem,
}

export default class NumberListItem extends React.Component<NumberPropsItem,NumberStateItem>{
  change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    const parsed = parseInt(v, 10);
    if (!(isNaN(parsed))){
      ev.setDebug(true);
      ev.setWarnOnUnboundAttributes(true);
      console.log("atttr?",this.props.model.value);
      this.props.model.value.set(parsed);
    }
  };
  componentDidMount() {
    ev.bindModelToComponent(this.props.model,this);
  }
  render() {
    return (
      <Row>
      <Col lg={1}>
        <input size={3} onChange={this.change} type='text'/>
      </Col>
    </Row>
    );
  }
}
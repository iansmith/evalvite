import {Col, Row} from "react-bootstrap";
import React from 'react';
import ev from 'evalvite';

import {NumberModelItem, NumberStateItem} from './models';

interface NumberPropsItem {
  model: NumberModelItem,
}

export default class NumberListItem extends React.Component<NumberPropsItem,NumberStateItem>{
  componentDidMount() {
    ev.bindModelToComponent(this.props.model,this);
  }
  render() {
    return (
      <Row>
      <Col lg={1}>
        <input type='text'/>
      </Col>
    </Row>
    );
  }
}
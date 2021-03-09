import React from 'react';
import {Col,Row} from "react-bootstrap";
import ev from 'evalvite';

import {ImportantCheckBoxModel} from './models';

type localProps = {
  model: ImportantCheckBoxModel,
}
type localState = {
  important: boolean; // needs to match the <boolean> of the attribute in model
}

export default class ImportantCheckBox extends React.Component<localProps, localState>{
  msg='this is my message, there are many like it but this one is mine';
  constructor(props:localProps) {
    super(props);
    ev.bindModelToComponent<ImportantCheckBoxModel>(this.props.model,this);
    this.state = { important: false};
  }
  change = (e: React.FormEvent<HTMLInputElement>) => {
    const {important} = this.props.model;
    important.set(!important.get());
  };
  render(): React.ReactNode {
    const {important} = this.state; // USE STATE!

    let content=
      <span className='text-muted'>{this.msg}</span>
    if (important) {
      content = <span className='font-weight-bold'>{this.msg}</span>
    }
    let box = <input type='checkbox' onChange={this.change}/>;
    return (
      <Row>
        <Col className='col-1 text-right'>{box}</Col>
        <Col className='col-4'>{content}</Col>
      </Row>
    );
  }
};
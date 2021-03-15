import React from 'react';
import ev from 'evalvite';

import {ResultModel} from './models';

interface resultProps {
  label: string,
  model: ResultModel
}

interface resultState {
  value: number;
}

export default class Result extends React.Component<resultProps, resultState> {
  constructor(props: resultProps) {
    super(props)
    this.state = { value: 0}
  }
  componentDidMount() {
    // xxx fix me: should be able to pass an object here?  confusing that you use the actual attr, not obj
    ev.bindModelToComponent(this.props.model,this);
  }
  render() {
    // mixing the static and dynamic, aw yeah
    const {value} = this.state;
    const {label} = this.props;
    return (
      <span><strong>{label}:</strong>{value}</span>
    );
  }
}
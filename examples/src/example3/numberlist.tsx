import {Col, Row} from "react-bootstrap";
import React from 'react';
import ev from 'evalvite';

import NumberModel, {NumberModelItem} from "./models";
import NumberListItem from "./numberlistitem";
import {instanceOfAttr} from "evalvite/lib/typeutils";

interface numberListProps {
  model: NumberModel,
}

// state looks like this... note, only one level deep!
interface numberListState {
  content: NumberModelItem[];
  isDefined: boolean;
  number: number;
  average: number;
  sum: number;
  max: number;
}

export default class NumberList extends React.Component<numberListProps,numberListState>{
  // when you are NOT in render() and almost always when handling input,
  // you want to manipulate ATTRIBUTES not their values. pull attributes from
  // this.props.model.<BLAHBLAH> and pull values from this.state.<BLAHBLAH>
  click = ()=>{
    const {content} = this.props.model;
    ev.setDebug(true);
    ev.setWarnOnUnboundAttributes(true);
    // add another
    const newElement = {value: ev.simple<number>(0)}
    content.push(newElement);
  }
  state: numberListState;
  constructor(props: numberListProps) {
    super(props)
    this.state = { content:[], isDefined:false, number:0, average:0, sum:0, max:0 }
  }
  componentDidMount() {
    ev.bindModelToComponent(this.props.model,this);
  }

  render(){
    const {content,isDefined,number,max,sum,average} = this.state;
    let results;

    if (!isDefined){
      results =
        <div>
          <span>No number cells</span>
        </div>
    } else {
      results =
        <div>
          <span>Entries: {number}</span><br/>
          <span>Sum: {sum}</span><br/>
          <span>Average {average}</span><br/>
          <span>Max {max}</span><br/>
        </div>
    }
    return (
      <div>
        <Row>
          <Col>
            {results}
          </Col>
          <Col className='offset-lg-4'>
            <button onClick={this.click}>Create New Number Cell</button>
          </Col>
        </Row>
        {/* iterate over the MODEL contents because we need to pass a MODEL down as prop */}
        {
          content.forEach((m: NumberModelItem) => (
            <NumberListItem model={m}/>
          ))
        }
      </div>
    );
  }
}
import {Col, Row} from "react-bootstrap";
import React from 'react';
import ev, {Attribute} from 'evalvite';

import NumberModel, {NumberModelItem, ResultModel} from "./models";
import NumberListItem from "./numberlistitem";
import Result from "./result";

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
    // add another
    const newElement = {value: ev.simple<number>(0,"newcontent")}
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
  newResultModel(a:Attribute<number>): ResultModel {
    return {
      value:a,
    }
  }

  render() {
    const {isDefined} = this.state;
    const {content, number, sum, average, max} = this.props.model;
    let results;

    console.log("render of ", this.state);
    if (!isDefined) {
      results =
        <div>
          <span>No number cells</span>
        </div>
    } else {
      results =
        <div>
          {/* pass down MODELS not values */}
          <Result label='Entries' model={this.newResultModel(number)}/> <br/>
          <Result label='Sum' model={this.newResultModel(sum)}/> <br/>
          <Result label='Average' model={this.newResultModel(average)}/> <br/>
          <Result label='Max' model={this.newResultModel(max)}/> <br/>
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
          content.map((m: NumberModelItem) => {
              console.log("number iter ", m.value, " and type ",typeof m.value);
              return (
                <NumberListItem model={m}/>
              );
            }
          )
        }
      </div>
    );
  }
}
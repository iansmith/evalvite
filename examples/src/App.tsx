import {Col, Container, Row} from "react-bootstrap";
import React from 'react';
import ev from 'evalvite';

import ImportantCheckBox from "./example1/importantcheckbox";
import FancyNames from "./example2/fancynames";
import NameModel from './example2/models';
import NumberModel from './example3/models';
import NumberList from './example3/numberlist';

type myProps = {};
type myState = {};

class App extends React.Component<myProps,myState> {

  render(): React.ReactNode{

    // have to put these here because of "use before defined"
    let nameModel1 = new NameModel('Jean','Louis');
    let nameModel2 = new NameModel('Bastien','Carrie');

    return (
    <Container fluid>
      <Row>
        <Col>
          <h3>Example 1</h3>
        </Col>
      </Row>
      <Row>
        <Col>
          {/* I just use a literal here for the model, probably no best practice */}
          <ImportantCheckBox model={{important:ev.simple<boolean>(false,"importantCheckbox")}}/>
        </Col>
      </Row>
      <hr/>
      <Row>
        <Col>
          <h3>Example 2</h3>
        </Col>
      </Row>
      <Row>
        <Col lg={3}>
          {/* pass an example model downward for each*/}
          <FancyNames model={nameModel1}/>
        </Col>
      </Row>
      <Row>
        <Col lg={3}>
          <FancyNames model={nameModel2}/>
        </Col>
      </Row>
      <Row>
        <Col lg={3}>
          <h3>Example 3</h3>
        </Col>
      </Row>
      <NumberList model={new NumberModel()}/>
    </Container>
    );
  }
}

export default App;

import React from "react";
import ev from "evalvite";

import NameModel from './models';

type myState = {
  firstName: string,
  lastName: string,
  frenchLastName: string,
  age: number,  // needs to be manually updated, not an attribute!
}

// normal "top down" data flow from parent to child.  this prop gets filled
// by the parent.
type myProps = {
  model: NameModel,
}

// no Higher Order Component (HOC) needed!
export default class FancyNames extends React.Component<myProps, myState> {
  constructor(props: myProps) {
    super(props);
    this.state = {firstName: '', lastName: '', frenchLastName:'', age: 0};
  }

  componentWillUnmount() {
    ev.unbindModelFromComponent(this.props.model,this);
  }

  componentDidMount() {
    ev.bindModelToComponent(this.props.model, this);
  }

  render(): React.ReactNode {
    if (!this.state) {
      return null;
    }
    const {firstName,age, lastName, frenchLastName} = this.state; // use the STATE!

    return (
          <div>
            <fieldset className="border p-2">
            <legend className="w-auto">{firstName} {lastName}</legend>
              <div>
                Version Française: {frenchLastName} {firstName}<br/>
                Age: {age}
              </div>
            </fieldset>
          </div>
      )
  }
}

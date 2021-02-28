import React from 'react';

export type evKeyedComponent = React.Component & {
  props: {
    evKey:string
  },
}

// to prevent annoying TS thing with {}
type empty = {[key:string]: any};

// Attribute is a wrapper around a value.  Using get() and set()
// allow the constraint system to perform updates as needed.
export interface Attribute<T> {
  // debugName will be displayed in log messages when you turn on debug mode.
  debugName: string;
  get(): T;
  set(v: T): void;
  // component connects a react component to this attribute.  When the attribute
  // is dirty, the component's visuals are dirty and forceUpdate() is used to
  // cause a redraw.
  component(c: evKeyedComponent|undefined, stateName:string): void;
}

// AttrPrivate is an interface that should not be needed by evalvite
// users, it is only useful in the implementation.  All attributes have
// these methods to support implementing the constraint graph and maintaining
// dirty bits.
export interface AttrPrivate<T> extends Attribute<T> {
  markDirty(): void;
  addOutgoing(target: AttrPrivate<any>): void;
  removeOutgoing(target: AttrPrivate<any>): void;
}

// vars is the utility variables of
export class vars {
  static evalViteDebug = false;
  static idCounter = 0;
  static logger : (s:string)=>void  = console.log;
}

// do this intermediate class so we can share code with the dirty marks and the outgoing edges
export abstract class AttrPrivateImpl<T> implements AttrPrivate<T> {
  public debugName: string;
  protected out: Array<AttrPrivate<any>>; // people that depend on my value
  protected dirty: boolean;
  protected comp:(evKeyedComponent|undefined) = undefined;
  protected stateName: string = '';
  protected initialized = false;

  protected constructor(n:string){
    this.debugName = n;
    this.out = [] as Array<AttrPrivate<any>>;
    this.dirty = false;  // this is only true for the simple case
  }

  public component(c: evKeyedComponent|undefined, stateName:string) {
    if (!c) { // clear the component if you pass falsey (usually undefined)
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: clearing React component`)
      }
      this.comp=undefined;
      this.stateName='';
    } else {
      if (this.comp && this.comp===c) { // no change case
        vars.logger(`same ev key found: ${c.props.evKey} so not updating component`);
        return;
      }
      if (this.comp) {  // this is to prevent a common error
        throw new Error(`attempt to connect component "${c},${c.props.evKey}" to an attribute ${this.debugName}, but it already has a component "${this.comp},${this.comp.props.evKey}"\n`+
        'Did you forget to clear component() from this attribute in componentWillUnmount()?')
      }
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: setting React component:${c}`)
      }
      this.comp = c;
      this.stateName = stateName;
      this.markDirty();
    }
  }

  public addOutgoing(target: AttrPrivate<any>) {
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: adding edge -> ${target.debugName}, now ${this.out.length+1} edges`);
    }
    let found=false;
    for (let i=0; i<this.out.length; i=i+1){
      if (this.out[i]===target) {
        found=true;
        break;
      }
    }
    if (found) {
      throw new Error('attempting to add an outgoing edge from '+this.debugName+" that already exists");
    }
    this.out.push(target);
  }

  public removeOutgoing(target: AttrPrivate<any>) {
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: removing edge -> ${target.debugName}`);
    }
    let found=false;
    let index=-1; // to force throw
    for (let i=0; i<this.out.length; i=i+1){
      if (this.out[i]===target) {
        found=true;
        index=i;
        break;
      }
    }
    if (!found) {
      throw new Error("unable to find target in outgoing edges of "+this.debugName)
    }
    if (this.out.length>1) {
      // the list is unordered so this trick is fine
      this.out[index] = this.out[0];
    }
    this.out.shift();
    return;
  }

  public markDirty(): void {
    if (this.dirty && !this.initialized) {
      if (vars.evalViteDebug) {
        vars.logger(
          `EVDEBUG: ${this.debugName}: no reason to mark dirty, already dirty`
        );
      }
      return;
    }
    this.initialized=true;
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: marking dirty recursive start [${this.out.length} edges] ------------- `);
    }
    this.out.forEach((n: AttrPrivate<any>) => {
      n.markDirty();
    });
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: ------------- marking dirty recursive end`);
    }
    this.dirty = true;
    this.updateComponent();
  }

  public updateComponent() {
    if (this.comp){
      let update: empty = {};
      update[this.stateName]=this.get(); // which clears the mark!
      this.comp.setState(update);
      if (vars.evalViteDebug){
        vars.logger(`EVDEBUG: ${this.debugName}: setting state in component: ${JSON.stringify(update)}`)
      }
    } else{
      console.log(this.debugName, " marked component dirty, but no connected component");
    }
  }

  // child classes have to use these two
  public abstract get(): T;
  public abstract set(v:T): void;
}
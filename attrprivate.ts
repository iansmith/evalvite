import React from 'react';

import { AttrPrivate, vars } from './base';
import {instanceOfAttr} from "./typeutils";

// to allow {} to work sensibly
// eslint-disable-next-line no-explicit-any
type empty = {[key:string]: unknown};

// do this intermediate class so we can share code with the dirty marks and the outgoing edges
export default abstract class AttrPrivateImpl<T> implements AttrPrivate<T> {

  protected out: Array<AttrPrivate<unknown>>; // people that depend on my value

  protected dirty: boolean;

  protected stateName = new Array<string>();

  protected initialized = false;

  protected boundComponents = new Array<React.Component>();

  protected dName : string;
  protected constructor(n: string) {
    this.dName = n;
    this.out = [] as Array<AttrPrivate<unknown>>;
    // this should probably always START in false so the first attempt to setDirty()
    // will cause the desired effects
    this.dirty = false;
  }

  // returns -1 if the target is not present
  protected findBoundComponentIndex(target: React.Component): number {
    for (let i = 0; i < this.boundComponents.length; i += 1) {
      if (this.boundComponents[i] === target) {
        return i;
      }
    }
    return -1;
  }

  public debugName(): string{
    return `${this.dName}:${this.attributeTypename()}`
  }

  public addComponent(c: React.Component, stateName: string): void {
    if (!c) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()} ignoring attempt to addComponent() with a falsey value`);
      }
      return;
    }
    if (this.findBoundComponentIndex(c) >= 0) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()} ignoring attempt to addComponent() which is already present`);
      }
      return;
    }
    if (!stateName) {
      throw new Error('no state name provided when attempting to add component to attribute');
    }
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName()}: binding react component`);
    }
    this.boundComponents.push(c);
    this.stateName.push(stateName); // parallel
    this.markDirty();
    // we have to make sure that the component gets update on the initial set
    this.updateComponents();
    // c.forceUpdate(()=>{console.log("callback for update happened")});
  }

  public removeComponent(c: React.Component, stateName: string): void {
    if (!c) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()} ignoring attempt to removeComponent() with a falsey value`);
      }
      return;
    }
    const index = this.findBoundComponentIndex(c);
    if (index < 0) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()} ignoring attempt to removeComponent() which is not present`);
      }
      return;
    }
    if (!stateName) {
      throw new Error('attempt to unbind a component without providing state name');
    }
    if (this.stateName[index] !== stateName) {
      throw new Error(`attempt to unbind a component, but provided wrong state name: ${stateName}`);
    }
    if (this.boundComponents.length === 1) {
      this.boundComponents = new Array<React.Component>();
      this.stateName = new Array<string>();
      return;
    }
    // this is safe, the parallel lists is not ordered
    const tmpComponent = this.boundComponents[0];
    const tmpStateName = this.stateName[0];
    this.boundComponents[0] = this.boundComponents[index];
    this.stateName[0] = this.stateName[index];
    this.boundComponents[index] = tmpComponent;
    this.stateName[index] = tmpStateName;
    this.boundComponents.pop();
    this.stateName.pop();
  }

  public addOutgoing(target: AttrPrivate<unknown>): void {
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName()}: adding edge -> ${target.debugName()}, now ${this.out.length + 1} edges`);
    }
    let found = false;
    for (let i = 0; i < this.out.length; i += 1) {
      if (this.out[i] === target) {
        found = true;
        break;
      }
    }
    if (found) {
      throw new Error(`attempting to add an outgoing edge from ${this.debugName()} that already exists`);
    }
    this.out.push(target);
  }

  public removeOutgoing(target: AttrPrivate<unknown>): void {
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName()}: removing edge -> ${target.debugName}`);
    }
    let found = false;
    let index = -1; // to force throw
    const { out } = this;

    for (let i = 0; i < out.length; i += 1) {
      if (out[i] === target) {
        found = true;
        index = i;
        break;
      }
    }
    if (!found) {
      throw new Error(`unable to find target in outgoing edges of ${this.debugName()}`);
    }

    if (out.length > 1) {
      // the list is unordered so this trick is fine...there must be a bug in eslint
      // because  I don't see how to use destructuring more than I already am...
      // eslint-disable-next-line prefer-destructuring
      out[index] = out[0];
    }
    out.shift();
  }

  public markDirty(): void {
    if (this.dirty && this.initialized) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()}: no reason to mark dirty, already dirty`);
      }
      return;
    }
    this.initialized = true;
    if (vars.evalViteDebug) {
      vars.logger(
        `EVDEBUG: ${this.debugName()}: marking dirty recursive start [${this.out.length} edges] ------------- `,
      );
    }
    this.out.forEach((n: AttrPrivate<unknown>) => {
      n.markDirty();
    });
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName()}: ------------- marking dirty recursive end`);
    }
    this.dirty = true;
    this.updateComponents();
  }

  public updateComponents(): void {
    if (this.boundComponents.length > 0) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()}: setting state in all components[${this.boundComponents.length}]`);
      }
      const myValue = this.get();
      vars.logger(`about drop in setting loop`);
      for (let i = 0; i < this.boundComponents.length; i += 1) {
        const stateName = this.stateName[i];
        const comp = this.boundComponents[i];
        const update = {} as empty;
        update[stateName]= myValue;
        vars.logger(`about to call setState`);
        comp.setState(update);
        if (vars.evalViteDebug) {
          vars.logger(
            `EVDEBUG: ${
              this.debugName()
            }: bound component state updated to: ${JSON.stringify(update)}`);
        }
      }
    } else if (vars.warnOnUnboundAttributes) {
      // eslint-disable-next-line no-console
      console.warn(this.debugName(), ' marked component dirty, but no connected component(s)');
    }
  }

  // use provided impl in index.ts
  public attributeTypename(): string {
    return vars.atttributeType(this);
  }

  // child classes have to implement these two
  public abstract wrappedTypename():string;

  public abstract get(): T;

  public abstract set(v: T): void;

}

import React from 'react';

import { AttrPrivate, vars, TopoMark} from './base';

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

  protected tmark = TopoMark.None;

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

  public  mark(): TopoMark {
    return this.tmark
  }

  public setMark(t: TopoMark):void {
    this.tmark =t;
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

  public getOutgoing():Array<AttrPrivate<any>>{
    return this.out
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
    if (this.dirty) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()}: no reason to mark dirty, already dirty`);
      }
      return;
    }
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
  }

  public markDirtyAndUpdate() {
    this.markDirty();
    const result=AttrPrivateImpl.topoSort(this);
    result.forEach((a:AttrPrivate<unknown>)=>{
      a.updateComponents();
    })
  }

  public updateComponents(): void {
    if (this.boundComponents.length > 0) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName()}: setting state in all components[${this.boundComponents.length}]`);
      }
      const myValue = this.get();
      for (let i = 0; i < this.boundComponents.length; i += 1) {
        const stateName = this.stateName[i];
        const comp = this.boundComponents[i];
        const update = {} as empty;
        update[stateName]= myValue;
        comp.setState((prev:any) => {
          if (prev){
            if (prev[stateName]===myValue) {
              return prev;
            }
            prev[stateName]=myValue;
            return prev;
          }
          if (vars.evalViteDebug){
            vars.logger(`EVDEBUG: ${this.debugName()}: updating component state (${JSON.stringify(prev)}) with: ${JSON.stringify(update)}`)
            if (prev && Object.keys(prev).indexOf(stateName)===-1) {
              console.warn(`state does not contain key ${stateName} and this is likely a programming error`)
            }
          }
          if (!prev){
            prev = {stateName:myValue};
          }
          return prev;
        });
        // if (vars.evalViteDebug) {
        //   vars.logger(
        //     `EVDEBUG: ${
        //       this.debugName()
        //     }: bound component state updated to: ${JSON.stringify(update)}`);
        // }
      }
    } else if (vars.warnOnUnboundAttributes && this.out.length===0) {
      // eslint-disable-next-line no-console
      console.warn(this.debugName(), ' marked component dirty, but no connected component(s)');
    }
  }

  // use provided impl in index.ts
  public attributeTypename(): string {
    return vars.atttributeType(this);
  }

  // topological sort credited to Tarjan, 1976
  public static topoSort = (start:AttrPrivate<any>):AttrPrivate<unknown>[] => {
    const topoResult = [] as AttrPrivate<unknown>[];
    let temps = [] as AttrPrivate<unknown>[];

    const visit = (n:AttrPrivate<unknown>)=> {
      if (n.mark() === TopoMark.Permanent) {
        return;
      }
      if (n.mark() === TopoMark.Temporary) {
        temps.forEach((t:AttrPrivate<unknown>)=>{console.log(t)})
        if (vars.abortOnCycle) {
          throw new Error("Cycle detected in the dependency graph. Cycle involves "+n.debugName())
        } else {
          console.warn("Cycle detected in dependency graph, breaking cycle...");
        }
        return;
      }
      n.setMark(TopoMark.Temporary);
      temps.push(n);
      n.getOutgoing().forEach((m:AttrPrivate<unknown>)=>{
        visit(m);
      });
      // remove n from list
      temps = temps.filter( (e:AttrPrivate<unknown>)=> {
        return e !== n;
      });
      n.setMark(TopoMark.Permanent);
      topoResult.unshift(n);
    };

    visit(start);
    if (temps.length>0){
      temps.forEach((t)=>{console.log("xxx ",temps.length,t.debugName())});
      throw new Error(`Topological sort algorithm did not terminate correctly: ${temps.length} marks remaining`)
    }
    topoResult.forEach((n)=>{n.setMark(TopoMark.None)}) // clean up for next time
    // debugging, turn this print on for seeing result of topo sort
    // topoResult.forEach((n)=>{console.log("topoResult: ",n)});
    return topoResult;
  }

  // child classes have to implement these two
  public abstract wrappedTypename():string;

  public abstract get(): T;

  public abstract set(v: T): void;

}



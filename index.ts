/* eslint-disable class-methods-use-this, new-cap */

// disabled those because if it wasn't for TS bugs (see below) we wouldn't need
// to do this type of crap
import SimpleAttribute from './simpleattr';
import ComputedAttribute from './computedattr';
import { Attribute as attr, vars } from './base';
import {bind, instanceOfAttr, unbind} from './typeutils';
import ArrayAttribute from './arrayattr';
import RecordAttribute from "./recordattr";

// there is some kind of bug with TS and trying to create the little "convienence
// grommet" around a package of code.  I tried exporting a constant
//
// const ev = {
//   simple: SimpleAttribute,
//   computed: ComputedAttribute,
//   array: AttrArray,
//   setDebug: debugFn,
//   setLogger: loggerFn,
//   bindModelToComponent: bind,
// };
//
// and I tried a namespace:
// declare namespace ev {
//   export class simple<T> extends SimpleAttribute<T>{}
//   export class computed<T> extends ComputedAttribute<T>{}
//   export class array<T extends Record<string,unknown>> extends AttrArray<T>{}
//   export function setDebug(d:boolean):void
//   export function setLogger(fn: (s: string) => void) :void
//   export function bindModelToComponent<T>(m:T,c:React.Component):void
// }
// This is with TS 4.2.
// Both resulted in compile-time problems, despite the fact that they seemed
// completely legit.
//
// I was forced to use this approach to at least have some kind of nice notation.

/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
type empty = { [key: string]: unknown };

// in case you prefer the model terminology
export interface evModel extends Record<string,undefined>{};

class ev {
  setDebug(d: boolean): void {
    vars.evalViteDebug = d;
  }

  setLoggerFunction(fn: (s: string) => void): void {
    vars.logger = fn;
  }

  simple<T>(t: T, debug?: string): Attribute<T> {
    return new SimpleAttribute<T>(t, debug);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computed<T>(fn: (...restArgs: any[]) => T, inputs: Attribute<unknown>[], name?: string): Attribute<T> {
    return new ComputedAttribute<T>(fn, inputs, name);
  }

  array<T extends evModel>(debugName?: string): ArrayAttribute<T> {
    return new ArrayAttribute<T>(debugName);
  }

  record<T extends evModel>(value:T, debugName?: string): Attribute<T> {
    return new RecordAttribute<T>(value, debugName) as Attribute<T>;
  }

  bindModelToComponent<T extends Record<string, unknown>>(m: T, c: React.Component) {
    bind<T>(m, c);
  }

  unbindModelFromComponent<T extends Record<string, unknown>>(m: T, c: React.Component) {
    unbind<T>(m, c);
  }
}

// this is the entry point for taking a structure (model usually) and returning
// it sans attributes because you evaluated all of them.
const decodeAttribute = (a:any):any => {
  if (a instanceof ArrayAttribute) {
    return ArrayAttribute.decode(a);
  }
  if (a instanceof ComputedAttribute) {
    return ComputedAttribute.decode(a)
  }
  if (a instanceof SimpleAttribute) {
    return SimpleAttribute.decode(a)
  }
  if (a instanceof RecordAttribute) {
    return RecordAttribute.decode(a)
  }
  if (typeof a === "object"){
    //recurse on fields
    let result = {} as empty;
    const keys = Object.keys(a) as Array<string>;
    keys.forEach((k:string)=>{
      if (instanceOfAttr(a[k])) {
        result[k]=decodeAttribute(a[k]);
      } else {
        result[k]=a[k];
      }
    })
    return result;
  }
  // a is a simple type, not object or attr
  return a;
}

vars.decodeAttribute = decodeAttribute;
export const decode = decodeAttribute;
export type Attribute<T> = attr<T>;
const evinstance = new ev();
export default evinstance;

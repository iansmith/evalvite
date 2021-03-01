import SimpleAttribute from './simpleattr';
import ComputedAttribute from './computedattr';
import ArrayAttr from './arrayAttr';
import {Attribute, AttrPrivate, vars} from './base';
import { bindModelToComponent as bind } from './recordcheck';
import AttrPrivateImpl from "./attrprivate";
import ArrayAttribute from "./arrayAttr";

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
class ev {
  debugFn = (d: boolean): void => {
    vars.evalViteDebug = d;
  }
  loggerFn = (fn: (s: string) => void): void => {
    vars.logger = fn;
  }
  simple<T>(t:T): Attribute<T> {
    return new SimpleAttribute<T>(t);
  }
  computed<T>(fn: (...args: unknown[]) => T, inputs: [...t: Array<AttrPrivate<unknown>>], debugName?: string): Attribute<T>{
    return new ComputedAttribute<T>(fn,inputs,debugName);
  }
  array<T extends Record<string, unknown>>(debugName?:string):Attribute<T[]>{
    return new ArrayAttribute<T>(debugName) as Attribute<T[]>; // gag, puke: this is awful
  }
  bindModelToComponent<T extends Record<string,unknown>>(m:T,c:React.Component) {
    bind<T>(m,c)
  }
}

const evinstance = new ev();
export default evinstance;
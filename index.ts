/* eslint-disable class-methods-use-this, new-cap, no-explicit-any */

// disabled those because if it wasn't for TS bugs (see below) we wouldn't need
// to do this type of crap
import SimpleAttribute from './simpleattr';
import ComputedAttribute from './computedattr';
import { Attribute as attr, vars } from './base';
import {bind, instanceOfAttr, unbind} from './typeutils';
import ArrayAttribute from './arrayattr';
import RecordAttribute from "./recordattr";
import NaiveArrayAttribute from "./naivearrayattr";

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
  // setDebug set to true will cause a lot of logging to the logger that starts
  // with the prefix 'EVDEBUG' so you can easily 'grep -v' if you want. This
  // debug information is probably only of interest to you if you are changing
  // evalvite itself.  The debug value defaults to false.  If you are using this
  // feature, you probably want to set the 'name' of all your attributes when
  // calling their constructors.
  setDebug(d: boolean): void {
    vars.evalViteDebug = d;
  }

  // setWarnOnUnboundAttributes set to true will cause a warning when you modify
  // an attribute and there is no component hooked to it. this can help debugging
  // if you have forgotten to call bindModelToComponent.  This defaults to false.
  // Note that if this is set to true, there often will be spurious warnings
  // generated during program startup because there are points in time when
  // attributes have been created and hooked to each other _before_ the
  // call to bindModelToComponent.
  setWarnOnUnboundAttributes(d: boolean): void {
    vars.warnOnUnboundAttributes = d;
  }

  // Set this to any function you choose, including ()=>{}.  This is where any
  // log messages generated by evalvite go. It defaults to console.log().
  setLoggerFunction(fn: (s: string) => void): void {
    vars.logger = fn;
  }

  // simpleattributes are ones where the value contained in the attribute is
  // a simple type like number or string.  Do not use this type for an object,
  // use record for that.
  simple<T>(t: T, debug?: string): Attribute<T> {
    return new SimpleAttribute<T>(t, debug);
  }

  // computed attributes are attributes whose value is computed from one or more
  // other attributes.  The function given here as the "computation" must be a pure
  // function of its inputs.  It is not recommended that you even use constants in
  // this computation--factor them out to the callers instead.  (You can also create
  // constants that are attributes, if you want!)  The parameters to the function
  // are the _unwrapped_ values contained in the list of inputs, the second parameter.
  // They need to match in number and type or you will get an error.
  // For example, if your computation function expects (a:number, b:string) as
  // parameters, the list of inputs should have the types [Attribute<number>,
  // Attribute<string>].  When any member of the list of inputs changes value,
  // this function will be called.
  computed<T>(fn: (...restArgs: any[]) => T, inputs: Attribute<unknown>[], name?: string): Attribute<T> {
    return new ComputedAttribute<T>(fn, inputs, name);
  }

  // array attributes can cause updates of dependent attributes based on two
  // types of changes: 1) changes to the number of elements in the array and
  // 2) changes to attributes in the models that compose the array.
  // Every element of the array has to be Record and this Record (usually a model)
  // may include any number of attributes, changes to any of which will
  // cause updates to dependent attributes.
  array<T extends evModel>(debugName?: string): ArrayAttribute<T> {
    return new ArrayAttribute<T>(debugName);
  }

  // record attribute is usually a model.  it can have any number of fields
  // and those fields can be attributes.  any fields that are not attributes
  // are assumed to be simple values that can be copied into the component's
  // state without worry.
  record<T extends evModel>(value:T, debugName?: string): Attribute<T> {
    return new RecordAttribute<T>(value, debugName) as Attribute<T>;
  }

  // naivearray is dumber than array.  it assumes that the parameter type T
  // is a simple type (not containing attributes) and that you only want
  // updates when the _number of values_ in the array changes.  This can
  // be useful if you are computing something based on the size of the array,
  // especially something like "is it empty?"
  naivearray<T>(debugName?: string): Attribute<T[]> {
    return new NaiveArrayAttribute<T>(debugName) as Attribute<T[]>;
  }

  // bindModelToComponent should be called in the component's constructor.
  // this informs evalvite that you want the "state" of the model to be
  // pushed into the component as the actual 'state' variable.
  bindModelToComponent<T extends Record<string, unknown>>(m: T, c: React.Component) {
    bind<T>(m, c);
  }

  // unbindModelFromComponent is the reverse of bindModelToComponent and probably
  // should be called from componentWillUnmount.  If you don't unbind components
  // from their models, you can end up with wasted work as evalvite tries to
  // recompute vales for a component that can't use them.
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
  if (a instanceof NaiveArrayAttribute) {
    return NaiveArrayAttribute.decode(a)
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

import {SimpleAttribute} from './simpleattr';
import {ComputedAttribute} from './computedattr';
import {AttrArray} from './attrarray';
import {vars} from "./evalvite";
import {bindModelToComponent as bind} from "./recordcheck";

namespace ev  {
  export class simple<T> extends SimpleAttribute<T>{};
  export class computed<T> extends ComputedAttribute<T>{};
  export class array<T> extends AttrArray<T>{};
  export const bindModelToComponent = bind;
  export function setDebug(b:boolean){
    vars.evalViteDebug=b;
  }
  export function setLogger(fn: (logMessage:string)=>void){
    vars.logger = fn;
  }
}

export default ev;
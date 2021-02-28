import SimpleAttribute from './simpleattr';
import ComputedAttribute from './computedattr';
import AttrArray from './attrarray';
import { vars } from './evalvite';
import { bindModelToComponent as bind } from './recordcheck';

// eslint-disable-next-line  @typescript-eslint/no-namespace
export namespace ev {
  export const simple = SimpleAttribute;
  export const computed = ComputedAttribute;
  export const array = AttrArray;
  export const bindModelToComponent = bind;
  export function setDebug(b: boolean): void {
    vars.evalViteDebug = b;
  }
  export function setLogger(fn: (logMessage: string) => void): void {
    vars.logger = fn;
  }
}

export default ev;

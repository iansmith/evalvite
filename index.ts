import SimpleAttribute from './simpleattr';
import ComputedAttribute from './computedattr';
import AttrArray from './attrarray';
import { vars } from './evalvite';
import { bindModelToComponent as bind } from './recordcheck';

const debugFn = (d: boolean): void => {
  vars.evalViteDebug = d;
};

const loggerFn = (fn: (s: string) => void): void => {
  vars.logger = fn;
};

const ev = {
  simple: SimpleAttribute,
  computed: ComputedAttribute,
  array: AttrArray,
  setDebug: debugFn,
  setLogger: loggerFn,
  bindModelToComponent: bind,
};

export default ev;

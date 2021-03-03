import AttrPrivateImpl from './attrprivate';
import { AttrPrivate, vars } from './base';

let { idCounter } = vars;
const { evalViteDebug } = vars;

// forward ref
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function decodeAttribute(a: AttrPrivateImpl<any>): any;
declare function modelToAttrFields(inst: Record<string, unknown>): Array<string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function instanceOfAttr(obj: any): obj is AttrPrivate<unknown>;

type empty = { [key: string]: unknown };
export default class RecordAttribute<T extends Record<string, unknown>> extends AttrPrivateImpl<T> {
  value:  T;
  constructor(value: T, name?: string) {
    super(name || `[record attr ${idCounter}`);
    if (!name) {
      idCounter += 1;
    }
    // this is just to make the compiler hapy
    this.value = value;
    // this is where do the real set
    this.set(value);
  }

  get(): T {
    const t = decodeAttribute(this) as T;
    this.dirty = false;
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: get record attr [${t}]`);
    }
    return t;
  }

  set(t: T): void {
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: record attr set to ${t}`);
    }
    this.value = t;
    const names = modelToAttrFields(t);
    names.forEach((k: string) => {
      const obj = t[k];
      if (instanceOfAttr(obj)) {
        // just to make the types work
        obj.addOutgoing(this);
      }
    });
    this.markDirty();
  }

  getField(name:string): any {
    return this.value[name];
  }
}

import AttrPrivateImpl from './attrprivate';
import { vars } from './base';
import { modelToAttrFields, instanceOfAttr} from "./typeutils";

let { idCounter } = vars;
const { evalViteDebug } = vars;

/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
type empty = { [key: string]: unknown };

export default class RecordAttribute<T extends Record<string, unknown>> extends AttrPrivateImpl<T> {
  value: T;

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
    const t = vars.decodeAttribute(this) as T;
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

  getField(name: string): any {
    return this.value[name];
  }

  public static decode(a: RecordAttribute<any>):any {
    const inner = a.value;
    const names = Object.keys(inner) as Array<string>;
    const result = {} as empty;
    names.forEach((k: string) => {
      // eslint-disable-next-line  @typescript-eslint/no-unused-vars
      result[k] = vars.decodeAttribute(inner[k]);
    });
    return result;
  }
}

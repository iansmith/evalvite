import { vars } from './base';
import AttrPrivateImpl from './attrprivate';
import './typeutils'; // import for effect

let { idCounter } = vars;
const { evalViteDebug } = vars;

export default class SimpleAttribute<T> extends AttrPrivateImpl<T> {
  private value: T;

  constructor(startingValue: T, debugName?: string) {
    super(debugName || `[simple attribute ${idCounter}]`);
    idCounter += 1;
    this.value = startingValue;
    this.markDirty(); // because we have "changed" the value
  }

  public set(newValue: T): void {
    if (newValue === this.value) {
      if (evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: ignoring set to same value`);
      }
      return;
    }
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: set to ${newValue}`);
    }
    this.value = newValue;
    this.markDirty();
  }

  public get(): T {
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: get of simple attribute: ${this.value}`);
    }
    this.dirty = false;
    return this.value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static decode(a: SimpleAttribute<any>): any {
    return a.get();
  }

  public wrappedTypename(): string {
    return `<${typeof this.value}>`;
  }

}

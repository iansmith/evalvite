import { AttrPrivate, vars } from './base';
import AttrPrivateImpl from './attrprivate';
import { modelToAttrFields, instanceOfAttr } from './typeutils';

export default class ArrayAttribute<T extends Record<string, unknown>> extends AttrPrivateImpl<T[]> {
  private inner: T[] = [] as T[];

  constructor(debugName?: string) {
    super(debugName || `[array attribute]`);
  }

  private static iterateAttrs(item: Record<string, unknown>, fn: (attr: AttrPrivate<unknown>) => void) {
    // we turn off eslint below because the keys that result here are already
    // checked in the modelToAttrFields() function.
    const keys = modelToAttrFields(item);
    keys.forEach((k: string) => {
      const prop = item[k] as AttrPrivate<unknown>;
      fn(prop);
    });
  }

  public push(item: T): void {
    if (vars.evalViteDebug){
      vars.logger(`push() called on array attr`)
    }
    this.inner.push(item);
    const keysOfAttrs = modelToAttrFields(item);
    keysOfAttrs.forEach((k: string) => {
      const value = item[k];
      if (instanceOfAttr(value)) {
        if (vars.evalViteDebug){
          vars.logger(`${value} is field ${k} and adding outgoing from it to ${this.debugName}`)
        }
        value.addOutgoing(this);
      }
    });
    this.markDirty();
  }

  public pop(): T {
    const value = this.inner.pop();
    if (value === undefined) {
      throw new Error('unable to pop for AttrArray, result is undefined!');
    }
    ArrayAttribute.iterateAttrs(value, (attr) => {
      attr.removeOutgoing(this);
    });
    // do this AFTER we removed the necessary edges
    this.markDirty();
    return value;
  }

  public get(): T[] {
    this.dirty = false;
    return ArrayAttribute.decode(this);
  }

  public set(a: T[]): void {
    // not clear the use of "set" is a good idea
    while (this.inner.length > 0) {
      this.pop(); // remove all the links to us
    }
    this.inner = a;
    this.markDirty();
  }

  public index(i: number): T {
    return this.inner[i];
  }

  public length(): number {
    return this.inner.length;
  }

  public wrappedTypename(): string {
    return typeof this.inner;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public map(fn: (t: T) => any): any[] {
    return this.inner.map(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static decode(a: ArrayAttribute<any>): any {
    // const arr = a.get(); // it knows it's an array here because of guard
    if (a.inner.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return a.inner.map((e: any) => vars.decodeAttribute(e));
    }
    return [];
  }

}

import { AttrPrivate } from './base';
import AttrPrivateImpl from './attrprivate';

declare function modelToAttrFields(inst: Record<string, unknown>): Array<string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function instanceOfAttr(obj: any): obj is AttrPrivate<unknown>;

export default class ArrayAttribute<T extends Record<string, unknown>> extends AttrPrivateImpl<T[]> {
  private inner: T[] = [] as T[];

  constructor(debugName?: string) {
    super(debugName || '');
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
    this.inner.push(item);
    const keysOfAttrs = modelToAttrFields(item);
    keysOfAttrs.forEach((k: string) => {
      const value = item[k];
      if (instanceOfAttr(value)) {
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
    return this.inner; // ugh, why can't it figure this out?
  }

  public set(a: T[]): void {
    // not clear the use of "set" is a good idea
    while (this.inner.length > 0) {
      this.pop(); // remove all the links to us
    }
    this.inner = a;
    this.markDirty();
  }
}

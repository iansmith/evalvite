import { AttrPrivate } from "./evalvite";
import AttrPrivateImpl from "./attrprivate";

import { instanceOfAttr, modelToAttrFields } from "./recordcheck";

export default class AttrArray<
  T extends Record<string, unknown>
> extends AttrPrivateImpl<T[]> {
  private inner: Array<T> = new Array<T>();

  constructor(debugName?: string) {
    super(debugName || "");
  }

  private static iterateAttrs(
    item: Record<string, unknown>,
    fn: (attr: AttrPrivate<unknown>) => void
  ) {
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
      const value = item[k] as AttrPrivate<unknown>;
      if (instanceOfAttr(value)) {
        // this is always true, just here for types
        value.addOutgoing(this);
      }
    });
    this.markDirty();
  }

  public pop(): T {
    const value = this.inner.pop();
    this.markDirty();
    if (value === undefined) {
      throw new Error("unable to pop for AttrArray, result is undefined!");
    }
    AttrArray.iterateAttrs(value, (attr) => {
      attr.removeOutgoing(this);
    });
    return value;
  }

  public get(): Array<T> {
    this.dirty = false;
    return this.inner;
  }

  public set(a: Array<T>): void {
    // not clear this is a good idea
    while (this.inner.length > 0) {
      this.pop(); // remove all the links to us
    }
    this.dirty = false;
    this.inner = a;
  }
}

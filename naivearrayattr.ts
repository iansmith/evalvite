import {Attribute, AttrPrivate} from './base';
import AttrPrivateImpl from './attrprivate';
import {modelToAttrFields,instanceOfAttr} from "./typeutils";
import {vars} from "./base";

export default class NaiveArrayAttribute<T> extends AttrPrivateImpl<T[]> {
  private inner: T[] = [] as T[];

  constructor(debugName?: string) {
    super(debugName ? debugName : `[naive array attribute]`);
  }

  public push(item: T): void {
    this.inner.push(item);
    this.markDirty();
  }

  public pop(): T {
    const value = this.inner.pop();
    if (value === undefined) {
      throw new Error('unable to pop for NaiveAttrArray, result is undefined!');
    }
    this.markDirty();
    return value;
  }

  public get(): T[] {
    this.dirty = false;
    return this.inner;
  }

  public set(a: T[]): void {
    // not clear the use of "set" is a good idea
    this.inner = a;
    this.markDirty();
  }

  public index(i:number): T {
    return this.inner[i];
  }

  public length(): number {
    return this.inner.length;
  }

  public map(fn:(t:T)=>any):any[]{
    return this.inner.map(fn);
  }

  public static decode(a:NaiveArrayAttribute<any>):any {
    return a.inner;
  }
}

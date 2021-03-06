import AttrPrivateImpl from './attrprivate';

export default class NaiveArrayAttribute<T> extends AttrPrivateImpl<T[]> {
  private inner: T[] = [] as T[];

  constructor(debugName?: string) {
    super(debugName || `[naive array attribute]`);
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

  public index(i: number): T {
    return this.inner[i];
  }

  public setIndex(i: number, v: T): void {
    this.inner[i] = v;
  }

  public length(): number {
    return this.inner.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public map(fn: (t: T) => any): any[] {
    return this.inner.map(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static decode(a: NaiveArrayAttribute<any>): any {
    return a.inner;
  }
}

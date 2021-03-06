import { AttrPrivate, Attribute, vars } from './base';
import AttrPrivateImpl from './attrprivate';

let { idCounter } = vars;
const { evalViteDebug } = vars;

export default class ComputedAttribute<T> extends AttrPrivateImpl<T> {

  private in: Array<Attribute<unknown>>;

  private cached: T | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fn: (...a2: any[]) => T;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(fn: (...a1: any[]) => T, inputs: Attribute<unknown>[], name?: string) {
    super(name ? name : `[computed attribute ${idCounter}]`);
    idCounter += 1;
    this.in = [] as Array<Attribute<unknown>>; // for a start
    this.out = [] as Array<AttrPrivateImpl<unknown>>;
    this.fn = fn;
    inputs.forEach((input: Attribute<unknown>) => {
      this.in.push(input);
      (input as AttrPrivate<unknown>).addOutgoing(this);
    });
    this.markDirty(); // mark the whole graph dirty
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public set(_newValue: T): void {
    throw new Error(`${this.debugName} unable to set the value of a constrained attribute!`);
  }

  public get(): T {
    if (!this.dirty) {
      if (this.cached === undefined) {
        throw new Error(`${this.debugName} attribute is not dirty but has no previously cached value`);
      }
      if (evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: no reason to recompute function, have cached value`);
      }
      return this.cached;
    }
    // need to recompute
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: evaluating function parameters`);
    }
    // we have disable eslint here because we need to use any to get the typing right
    // on the line below where we assign this params value to actuals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: unknown[] = this.in.map((dep: Attribute<unknown>): unknown => {
      return dep.get();
    });
    const { fn } = this;
    // type chk = Parameters<typeof fn>;  the rest parameter seems to be biting us here
    // const actuals: chk = params;
    const actuals: unknown[] = params;
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: evaluating function and returning value`);
    }
    this.cached = fn.apply(this, actuals);
    this.dirty=false;
    return this.cached;
  }

  public static decode(a:ComputedAttribute<any>):any {
    return a.get();
  }

}

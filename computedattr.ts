import { AttrPrivate, Attribute, vars } from './evalvite';
import AttrPrivateImpl from './attrprivate';

let { idCounter } = vars;
const { evalViteDebug } = vars;

export default class ComputedAttribute<T> extends AttrPrivateImpl<T> {
  public debugName: string;

  private in: Array<AttrPrivate<unknown>>;

  private cached: T | undefined;

  private fn: (...args: Array<Attribute<unknown>>) => T;

  constructor(fn: (...args: unknown[]) => T, inputs: [...t: Array<AttrPrivate<unknown>>], debugName?: string) {
    super(debugName || '');
    this.debugName = debugName || `[computed attribute ${idCounter}]`;
    idCounter += 1;
    this.in = [] as Array<AttrPrivate<unknown>>; // for a start
    this.out = [] as Array<AttrPrivate<unknown>>;
    this.fn = fn;
    inputs.forEach((input: AttrPrivate<unknown>) => {
      this.in.push(input);
      input.addOutgoing(this);
    });
    this.dirty = true;
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
    const params: any[] = this.in.map((dep: Attribute<unknown>): unknown => {
      return dep.get();
    });
    const { fn } = this;
    type chk = Parameters<typeof fn>;
    const actuals: chk = params;
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: evaluating function and returning value`);
    }
    this.cached = fn.apply(this, actuals);
    this.dirty = false;
    return this.cached;
  }
}

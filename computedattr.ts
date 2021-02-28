import {AttrPrivate, Attribute, vars, AttrPrivateImpl} from "./evalvite";

let {idCounter} = vars;
const {evalViteDebug} = vars;

export class ComputedAttribute<T> extends AttrPrivateImpl<T> {
  public debugName: string;
  private in: Array<AttrPrivate<any>>;
  private cached: T | undefined;
  private fn: (...args: Array<Attribute<any>>) => T;

  constructor(
    fn: (...args: any[]) => T,
    inputs: [...t: Array<AttrPrivate<any>>],
    debugName?: string
  ) {
    super(debugName ? debugName : '');
    this.debugName = debugName
      ? debugName
      : `[computed attribute ${idCounter}]`;
    idCounter = idCounter + 1;
    this.in = [] as Array<AttrPrivate<any>>; // for a start
    this.out = [] as Array<AttrPrivate<any>>;
    this.fn = fn;
    inputs.forEach((input: AttrPrivate<any>) => {
      this.in.push(input);
      input.addOutgoing(this);
    });
    this.dirty=true;
  }

  public set(newValue: T): void {
    throw new Error(
      `${this.debugName} unable to set the value of a constrained attribute!`
    );
  }

  public get(): T {
    if (!this.dirty) {
      if (this.cached === undefined) {
        throw new Error(
          `${this.debugName} attribute is not dirty but has no previously cached value`
        );
      }
      if (evalViteDebug) {
        vars.logger(
          `EVDEBUG: ${this.debugName}: no reason to recompute function, have cached value`
        );
      }
      return this.cached;
    }
    // need to recompute
    if (evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: evaluating function parameters`);
    }
    const params: any = this.in.map((dep: Attribute<any>): any => {
      return dep.get();
    });
    const fn = this.fn;
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
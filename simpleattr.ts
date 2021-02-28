import { AttrPrivateImpl, vars} from "./evalvite";

let {idCounter} = vars;
const {evalViteDebug} = vars;

export class SimpleAttribute<T> extends AttrPrivateImpl<T> {
  public debugName: string;
  private value: T;

  constructor(startingValue: T, debugName?: string) {
    super(debugName?debugName:'');
    this.debugName = debugName ? debugName : `[simple attribute ${idCounter}]`;
    idCounter = idCounter + 1;
    this.value=startingValue;
    this.markDirty();
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
}

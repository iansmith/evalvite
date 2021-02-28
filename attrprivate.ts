// do this intermediate class so we can share code with the dirty marks and the outgoing edges
import { AttrPrivate, evKeyedComponent, vars } from './evalvite';

// to prevent annoying TS thing with {}
type empty = { [key: string]: unknown };

export default abstract class AttrPrivateImpl<T> implements AttrPrivate<T> {
  public debugName: string;

  protected out: Array<AttrPrivate<unknown>>; // people that depend on my value

  protected dirty: boolean;

  protected comp: evKeyedComponent | undefined = undefined;

  protected stateName = '';

  protected initialized = false;

  protected constructor(n: string) {
    this.debugName = n;
    this.out = [] as Array<AttrPrivate<unknown>>;
    this.dirty = false; // this is only true for the simple case
  }

  public component(c: evKeyedComponent | undefined, stateName: string): void {
    if (!c) {
      // clear the component if you pass falsey (usually undefined)
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: clearing React component`);
      }
      this.comp = undefined;
      this.stateName = '';
    } else {
      if (this.comp && this.comp === c) {
        // no change case
        vars.logger(`same ev key found: ${c.props.evKey} so not updating component`);
        return;
      }
      if (this.comp) {
        // this is to prevent a common error
        throw new Error(
          `attempt to connect component "${c},${c.props.evKey}" to an attribute ${this.debugName}, but it already has a component "${this.comp},${this.comp.props.evKey}"\n` +
            'Did you forget to clear component() from this attribute in componentWillUnmount()?',
        );
      }
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: setting React component:${c}`);
      }
      this.comp = c;
      this.stateName = stateName;
      this.markDirty();
    }
  }

  public addOutgoing(target: AttrPrivate<unknown>): void {
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: adding edge -> ${target.debugName}, now ${this.out.length + 1} edges`);
    }
    let found = false;
    for (let i = 0; i < this.out.length; i += 1) {
      if (this.out[i] === target) {
        found = true;
        break;
      }
    }
    if (found) {
      throw new Error(`attempting to add an outgoing edge from ${this.debugName} that already exists`);
    }
    this.out.push(target);
  }

  public removeOutgoing(target: AttrPrivate<unknown>): void {
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: removing edge -> ${target.debugName}`);
    }
    let found = false;
    let index = -1; // to force throw
    const { out } = this;

    for (let i = 0; i < out.length; i += 1) {
      if (out[i] === target) {
        found = true;
        index = i;
        break;
      }
    }
    if (!found) {
      throw new Error(`unable to find target in outgoing edges of ${this.debugName}`);
    }

    if (out.length > 1) {
      // the list is unordered so this trick is fine...there must be a bug in eslint
      // because  I don't see how to use destructuring more than I already am...
      // eslint-disable-next-line prefer-destructuring
      out[index] = out[0];
    }
    out.shift();
  }

  public markDirty(): void {
    if (this.dirty && !this.initialized) {
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: no reason to mark dirty, already dirty`);
      }
      return;
    }
    this.initialized = true;
    if (vars.evalViteDebug) {
      vars.logger(
        `EVDEBUG: ${this.debugName}: marking dirty recursive start [${this.out.length} edges] ------------- `,
      );
    }
    this.out.forEach((n: AttrPrivate<unknown>) => {
      n.markDirty();
    });
    if (vars.evalViteDebug) {
      vars.logger(`EVDEBUG: ${this.debugName}: ------------- marking dirty recursive end`);
    }
    this.dirty = true;
    this.updateComponent();
  }

  public updateComponent(): void {
    if (this.comp) {
      const update: empty = {};
      update[this.stateName] = this.get(); // which clears the mark!
      this.comp.setState(update);
      if (vars.evalViteDebug) {
        vars.logger(`EVDEBUG: ${this.debugName}: setting state in component: ${JSON.stringify(update)}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(this.debugName, ' marked component dirty, but no connected component');
    }
  }

  // child classes have to use these two
  public abstract get(): T;

  public abstract set(v: T): void;
}

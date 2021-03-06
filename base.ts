import React from 'react';

// Attribute is a wrapper around a value.  Using get() and set()
// allow the constraint system to perform updates as needed.
export interface Attribute<T> {
  // debugName will be displayed in log messages when you turn on debug mode.
  debugName(): string;
  get(): T;
  set(v: T): void;
  // component connects a react component to this attribute.  When the attribute
  // is dirty, the component's visuals are dirty and forceUpdate() is used to
  // cause a redraw.
  addComponent(c: React.Component | undefined, stateName: string): void;
  removeComponent(c: React.Component, stateName: string): void;
}

export enum TopoMark {
  None,
  Temporary,
  Permanent,
}

// AttrPrivate is an interface that should not be needed by evalvite
// users, it is only useful in the implementation.  All attributes have
// these methods to support implementing the constraint graph and maintaining
// dirty bits.
export interface AttrPrivate<T> extends Attribute<T> {
  markDirty(): void;
  // this should be used when you get a call to set a value
  markDirtyAndUpdate(): void;
  updateComponents():void;
  addOutgoing(target: AttrPrivate<unknown>): void;
  removeOutgoing(target: AttrPrivate<unknown>): void;
  getOutgoing(): Array<AttrPrivate<unknown>>
  mark(): TopoMark;
  setMark(t:TopoMark):void;

  // just for making debugging output nice
  attributeTypename(): string;
  // just for making debugging output nice
  wrappedTypename(): string;
}

// vars is the utility variables of
export class vars {
  static evalViteDebug = false;

  static warnOnUnboundAttributes = false;

  static idCounter = 0;

  static abortOnCycle = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static decodeAttribute: (a: any) => any = (a: any): any => {
    throw new Error(
      `trying to decode ${a}:decode function not set yet, probably need to import entire package (index.ts)`,
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static atttributeType(a:any):any {
    throw new Error(
      `trying to get type for ${a}:decode function not set yet, probably need to import entire package (index.ts)`,
    );
  };

  // eslint-disable-next-line no-console
  static logger: (s: string) => void = console.log;
}

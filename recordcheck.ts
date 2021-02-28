import { AttrPrivate, evKeyedComponent } from './evalvite';

// without disabling this, we can't get the types right on obj (unknown won't work)
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
export function instanceOfAttr(obj: any): obj is AttrPrivate<unknown> {
  if (obj === null) {
    return false;
  }
  if (typeof obj !== 'object') {
    return false;
  }
  // console.log("checking instance: ",object," and ",typeof object, " plus ",'addOutgoing' in object);
  return 'addOutgoing' in obj;
}

// given a model, compute the field names that are attributes
// theselves.
export function modelToAttrFields(inst: Record<string, unknown>): Array<string> {
  const result = new Array<string>();
  const objectKeys = Object.keys(inst) as Array<string>;
  objectKeys.forEach((k: string) => {
    const prop = inst[k];
    if (instanceOfAttr(prop)) {
      result.push(k);
    }
  });
  return result;
}

export function bindModelToComponent<T>(inst: Record<string, unknown>, c: evKeyedComponent): void {
  if (typeof inst !== 'object') {
    // protected from common error
    throw new Error('models must be objects with exactly one level, e.g. {name:"mr. foo", address:"123 fleazil st"}');
  }
  const fields = modelToAttrFields(inst);
  fields.forEach((k) => {
    (inst[k] as AttrPrivate<T>).component(c, k);
  });
}

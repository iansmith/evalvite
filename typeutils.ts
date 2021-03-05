import { AttrPrivate } from './base';

// without disabling this, we can't get the types right on obj (unknown won't work)
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
// themselves.
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


export function bind<T extends Record<string, unknown>>(inst: Record<string, unknown>, c: React.Component): void {
  const fields = modelToAttrFields(inst);
  fields.forEach((k) => {
    (inst[k] as AttrPrivate<T>).addComponent(c, k);
  });
}

export function unbind<T>(inst: Record<string, unknown>, c: React.Component): void {
  if (typeof inst !== 'object') {
    // protected from common error
    throw new Error('models must be objects with exactly one level, e.g. {name:"mr. foo", address:"123 fleazil st"}');
  }
  const fields = modelToAttrFields(inst);
  fields.forEach((k) => {
    (inst[k] as AttrPrivate<T>).removeComponent(c, k);
  });
}

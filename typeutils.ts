import { AttrPrivate } from './base';
import AttrPrivateImpl from './attrprivate';
import SimpleAttribute from './simpleattr';
import ComputedAttribute from './computedattr';
import ArrayAttribute from './arrayattr';
import RecordAttribute from './recordattr';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
type empty = { [key: string]: unknown };

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

// the compiler thinks is not used because nobody imports it
// but really we used declare to avoid loops of imports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function decodeAttribute(a: AttrPrivateImpl<any>): any {
  const isSimple = (attr: any): attr is SimpleAttribute<any> => !!(attr instanceof SimpleAttribute);
  const isComputed = (attr: any): attr is ComputedAttribute<any> => !!(attr instanceof ComputedAttribute);
  const isArray = (attr: any): attr is ArrayAttribute<any> => !!(attr instanceof ArrayAttribute);
  const isRecord = (attr: any): attr is RecordAttribute<any> => !!(attr instanceof RecordAttribute);

  // this construction of ifs is due to the way TS handles typeguards
  if (isSimple(a)) {
    console.log('getRecord: isSimple ', a);
    return a.get();
  }
  if (isComputed(a)) {
    console.log('getRecord: isComputed ', a);
    return a.get();
  }
  if (isArray(a)) {
    const arr = a.get(); // it knows it's an array here because of guard
    console.log('getRecord: isArray ', arr, ' length ', arr.length);
    if (arr.length > 0) {
      return arr.map((e: any) => decodeAttribute(e));
    }
    return [];
  }
  if (isRecord(a)) {
    console.log('getRecord record: ', a);
    const names = Object.keys(a) as Array<string>;
    const result = {} as empty;
    names.forEach((k: string) => {
      result[k] = decodeAttribute(a.getField(k));
    });
    return result;
  }
  // this is the "simple value" case
  return a;
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

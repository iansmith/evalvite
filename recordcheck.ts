import {AttrPrivate, evKeyedComponent} from "./evalvite";

export function instanceOfAttr(object: any): object is AttrPrivate<any> {
  if (typeof object !== 'object'){
    return false;
  }
  //console.log("checking instance: ",object," and ",typeof object, " plus ",'addOutgoing' in object);
  return ('addOutgoing' in object) ;
}

// given a model, compute the field names that are attributes
// theselves.
export function modelToAttrFields(inst:any):Array<string>{
  let result = new Array<string>();
  const objectKeys = Object.keys(inst) as Array<string>;
  for (let k in objectKeys) {
    const prop = Object.values(inst)[k];
    if (instanceOfAttr(prop)) {
      result.push(objectKeys[k]);
    }
  }
  return result;
};

export function bindModelToComponent<T>(inst: any, c: evKeyedComponent){
  if (typeof inst !== 'object'){ // protected from common error
    throw new Error('models must be objects with exactly one level, e.g. {name:"mr. foo", address:"123 fleazil st"}')
  }
  const fields = modelToAttrFields(inst);
  for (let k of fields) {
    (inst[k] as AttrPrivate<T>).component(c,k);
  }
}


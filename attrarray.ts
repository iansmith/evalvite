import {AttrPrivate, AttrPrivateImpl} from "./evalvite";
import {instanceOfAttr, modelToAttrFields} from "./recordcheck";

export class AttrArray<T> extends AttrPrivateImpl<T[]> {
  private inner: Array<T> = new Array<T>();

  constructor(debugName?:string, ) {
    super(debugName ? debugName : '');
  }
  private iterateAttrs(item:T, fn:(attr:AttrPrivate<any>)=>void){
    const keys = modelToAttrFields(item);
    for (let k in keys){
      const prop = Object.values(item)[k];
      fn(prop);
    }
  }
  public push(item:T) : void{
    this.inner.push(item);
    const keysOfAttrs = modelToAttrFields(item);
    const objectKeys = Object.keys(item) as Array<string>;
    for (let k of keysOfAttrs) {
      const index = objectKeys.indexOf(k);
      if (index<0){
        continue;
      }
      const value = Object.values(item)[index];
      if (instanceOfAttr(value)) { // this is always true, just here for types
        value.addOutgoing(this);
      }
    }
    this.markDirty();
  }
  public pop(): T {
    const value = this.inner.pop();
    this.markDirty();
    if (value===undefined){
      throw new Error("unable to pop for AttrArray, result is undefined!")
    }
    this.iterateAttrs(value,(attr)=>{
      attr.removeOutgoing(this);
    })
    return value;
  }

  public get():Array<T> {
    this.dirty=false;
    return this.inner;
  }
  public set(a:Array<T>) {  // not clear this is a good idea
    while (this.inner.length>0){
      this.pop(); //remove all the links to us
    }
    this.dirty=false;
    this.inner = a;
  }
}
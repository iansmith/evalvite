import {Attribute} from 'evalvite/lib/base';
import ev from 'evalvite';

class NameModel {
  [key:string]:any;
  firstName : Attribute<string> = ev.simple<string>('');
  lastName: Attribute<string>= ev.simple<string>('');
  frenchLastName: Attribute<string>;
  age: number = 0; // see exercise for the reader in README.md
  // these are the initial values for the instance variables
  constructor(first:string, last:string) {
    this.firstName.set(first);
    this.lastName.set(last);
    this.frenchLastName=ev.computed<string>((confusingLastName:string)=>{
      return confusingLastName.toUpperCase();
    },[this.lastName])
  }
}

export default NameModel;

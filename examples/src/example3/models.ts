import ev, {Attribute} from 'evalvite';
import ArrayAttribute from 'evalvite/lib/arrayattr';
import RecordAttribute from "evalvite/lib/recordattr";

//
// note: this pattern of models is exactly identical to the "FooListItem" and
// note: FooList that you see so often in React.  It is also for the same reason,
// note: to make it easy to pass values from parent to child.
//

// model for one input box
export interface NumberModelItem {
  [key:string]:any;
  value: Attribute<number>;
}

// the compute functions need to work with the "flattened" representation of the model
export interface NumberStateItem {
  value: number;
}

// model for the whole example
class NumberModel_ {
  [key:string]:any;

  // array content has to be a record, can't be just ArrayAttribute<number>
  // see note above about parent v. child
  content: ArrayAttribute<NumberModelItem>;
  isDefined: Attribute<boolean>;
  number: Attribute<number>;
  average: Attribute<number>;
  sum: Attribute<number>;
  max: Attribute<number>;

  constructor() {
    this.content = ev.array<NumberModelItem>('content');
    // how many items
    this.number=ev.computed<number>(
      (values:NumberStateItem[])=>{
        return values.length;
      },[this.content],'number');

    // is it zero length?
    this.isDefined=ev.computed<boolean>(
      (n:number)=>n>0, [this.number], 'isDefined');

    // sum
    this.sum=ev.computed<number>(
      (values:NumberStateItem[])=>(values.map((nm:NumberStateItem)=>nm.value).reduce((prev:number, curr:number)=>prev+curr,0)),
      [this.content],'sum');

    // avg
    this.average=ev.computed<number>((total:number, howMany:number,divisionOK:boolean): number => {
        if (divisionOK) {
          return total / howMany
        }
        return 0; // won't matter, user will not see this
      }, [this.sum, this.number, this.isDefined]
    );

    // max
    this.max=ev.computed<number>((values:NumberStateItem[]): number => {
      return values.map((nm:NumberStateItem)=>nm.value).reduce((prev:number, curr:number)=>prev>curr?prev:curr,0)},
        [this.content],'max');
    }
}

export default class NumberModel extends RecordAttribute<NumberModel_> {
  [key:string]:any;
  constructor() {
    super(new NumberModel_());
  }
}

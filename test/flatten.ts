import {describe, expect, it} from "@jest/globals";
import ev, {Attribute, decode} from '../index';
import ignore from "ignore";

interface childish {
  [key:string]:any;  // required as it allows us to treat this model as a dictionary
  plain: number;
  simple: Attribute<number>
}

interface rootish  {
  [key:string]:any; // required as it allows us to treat this model as a dictionary
  notattr : string;
  simple: Attribute<string>;
  child: childish;
}

describe('flattening for "state" of component', ()=> {
    it("should return a flattened structure for rec inside rec", () => {
      const kid: childish = {
        plain: 42,
        simple: ev.simple<number>(43, 'kid'),
      }
      const root: rootish = {
        notattr: 'loser',
        simple: ev.simple<string>('baby', 'rootish'),
        child: kid,
      }

      const result = ev.decode(root);
      expect(result).toStrictEqual({
        notattr: 'loser',
        simple: 'baby',
        child: {
          plain: 42,
          simple: 43,
        }
      })
    })

    it("should output correct, but flat, value for computed attr", () => {
      const a=ev.simple<number>(2);
      const b=ev.simple<number>(4);
      const c=ev.simple<number>(8);
      const d = ev.computed<number>((a:number,b:number,c:number)=>{
        return a*(b+c)
      },[a,b,c])
      type myType = {
        foo:Attribute<number>,
      }
      const result:myType ={foo:d};
      expect(ev.decode(result)).toStrictEqual({foo:24});
    })

    it("should return a flattened structure for array of rec", () => {
      const arr = ev.array<childish>();
      const child0: childish = {
        plain: 1999,
        simple: ev.simple<number>(2000),
      };
      const child1: childish = {
        plain: 0,
        simple: ev.simple<number>(1),
      };
      const child2: childish = {
        plain: -10,
        simple: ev.simple<number>(-11),
      };
      arr.push(child0);
      arr.push(child1);
      arr.push(child2);

      expect(arr.get()).toStrictEqual([
          {plain: 1999, simple: 2000},
          {plain: 0, simple: 1},
          {plain: -10, simple: -11},
        ]
      )
    })

    it("should return an unchanged value for non-attributes", () => {
        expect(decode('abc')).toStrictEqual('abc');
        expect(decode(27)).toStrictEqual(27);
        expect(decode({})).toStrictEqual({});
        expect(decode({'a':'b',c:4,e:undefined}))
          .toStrictEqual({'a':'b',c:4,e:undefined});
        expect(decode({a:[1,3,5,7]}))
          .toStrictEqual({a:[1,3,5,7]});
      }
    )
  }
)
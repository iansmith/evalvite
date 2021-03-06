import ev, {Attribute} from '../index';
import {describe, expect, it} from "@jest/globals";

function getNanoSecTime() {
  var hrTime = process.hrtime();
  return hrTime[0] * 1000000000 + hrTime[1];
}

describe('computes correct, to up to date values', ()=> {
  it('should handle updates to an array correctly', () => {
    // this is a "model" in our terminology... you must have an array
    // of "models" for array to work properly... you can't do this:
    //
    type myModel = {
      [key: string]: any,
      v: Attribute<number>,
    }
    //note: has to be a model, can't be just simpleAttribute<number>
    const a = ev.array<myModel>();

    for (let i = 0; i < 10; i++) {
      const rec = {v: ev.simple<number>(i, `elem#${i}`)};
      a.push(rec);
    }
    // this is the type that would get passed to the state value in a
    // component or to a compute function, which is why we use it below.
    // it's the "flat" version of myModel above
    type flatMyModel = {
      v: number;
    }

    // usually, you don't want your deps on the elements of the array but
    // the array as a whole because you want to recompute if the number of
    // elements changes OR the value of some element changes
    const sum = ev.computed<number>((models: flatMyModel[]) => {
      const values = models.map((m: flatMyModel) => m.v)
      return values.reduce((a: number, b: number) => a + b, 0);
    }, [a], 'sum')

    // for proving we don't do things we don't need to
    let computeCounts: number = 0;

    // have to get a dependency to the *array* here, not its content... but
    // that's really for avoiding the appearance of side-effects. If we *only*
    // had a dependency on the sum, we'd be ok, but then we'd be computing
    // our function over something
    const avg = ev.computed<number>((sum: number, models: myModel[]) => {
      computeCounts = computeCounts + 1;
      return sum / models.length;
    }, [sum, a], 'avg')

    expect(sum.get()).toStrictEqual(45);
    expect(avg.get()).toStrictEqual(4.5);

    const rec = {v: ev.simple<number>(100)};
    a.push(rec);

    expect(sum.get()).toStrictEqual(145 /* 45 + 100 just added to end*/);
    expect(avg.get()).toStrictEqual(145 / 11); // safety first
    computeCounts = 0;
    avg.get();
    expect(computeCounts).toStrictEqual(0);

    a.index(0).v.set(33); // change elem 0 from 0 value to 33
    expect(sum.get()).toStrictEqual(145 + 33);
    expect(avg.get()).toStrictEqual((145 + 33) / 11); // safety first
    expect(computeCounts).toStrictEqual(1);
  })
  // macbook pro, 2.6 GHz 6-Core Intel Core i7, node v14.13.1
  // iter=1
  // ~3000 marks/sec
  // ~3000 evals/sec
  // iter=50  (probably gets some more of the JIT compiler involved)
  // ~10000 marks/sec
  // ~3000 evals/sec
  it('should handle a long chain of dependencies correctly', () => {
    const start = ev.simple<number>(0);
    let chainSize = 1500;
    let prev = start;
    for (let i = 0; i < chainSize; i = i + 1) {
      const curr = ev.computed<number>((n: number) => n + 1,
        [prev], `chain-element-#${i}`);
      prev = curr;
    }
    //prev now points to elem chainSize in the chain
    expect(prev.get()).toStrictEqual(chainSize);

    let sumMark = 0;
    let sumEval = 0;
    const iters = 1;
    for (let i = 0; i < iters; i = i + 1) {
      const startMarking = getNanoSecTime();
      start.set((i + 1) * chainSize);
      const finishMarking = getNanoSecTime();
      sumMark = sumMark + ((finishMarking - startMarking) / 1000000);

      const startEval = getNanoSecTime()
      expect(prev.get()).toStrictEqual((i + 2) * chainSize);
      const finishEval = getNanoSecTime();
      sumEval = sumEval + ((finishEval - startEval) / 1000000);
    }

    //console.log("marking sum ",chainSize*iters/sumMark," marks/sec");
    //console.log("eval sum ", chainSize*iters/sumEval, " evals/sec");

  });
  it('should correctly update length in naive array case', () => {
    const arr = ev.naivearray<number>()
    const lengthAttr = ev.computed<number>( (naiveContent: number[])=>{
      return naiveContent.length;
    },[arr]);

    expect(lengthAttr.get()).toStrictEqual(0);

    arr.push(7);
    arr.push(8);
    arr.push(42);

    expect(lengthAttr.get()).toStrictEqual(3);

    arr.setIndex(2,0); // no effect on derived attributes!
    expect(lengthAttr.get()).toStrictEqual(3);

    const v=arr.pop();
    expect(v).toStrictEqual(0);  // set above changed 42 to 0
    expect(lengthAttr.get()).toEqual(2);

    arr.pop();
    arr.pop();
    expect(lengthAttr.get()).toStrictEqual(0);

  });
});
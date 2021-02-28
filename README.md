# EvalVite --- a smaller, simpler data model for React

## Introduction
Redux is too big and vastly too complex for what it does.  
We need something _much_ simpler, and _much_ smaller.
Thus, evalvite.  It's designed for typescript + React and assumes that you are
using class-based React components, not FCs.

evalvite is based on the 1991 research paper by Scott Hudson.  We use the
all lowercase version of evalvite to indicate this software, we use the uppercase
version, EvalVite, to indicate the algorithm from the paper.  Although the
base algorithm used is the same as that explained in the paper, because the web
browser is not lazy, the benefits of the algorithm's laziness cannot easily
be exploited.  However, like EvalVite, evalvite is incremental in its evaluations.

https://smartech.gatech.edu/handle/1853/3618

## How it works
The most important thing to understand is that evalvite creates a model for your
React component, and guarantees that this model is up to date.  For the convenience
of your `render()` function, the values from the model are automatically propagated
to your component's state--and with the same names.

A model is composed of _attributes_ that are typescript generics wrapped around
a simple data value and anything else you want.  evalvite is careful
not to mess with things that are not attributes and thus they are not
automatically propagated to the component's state.

Here's an example, slightly simplified for clarity:
```typescript
import ev from 'evalvite';

class myModel {
  firstName : ev.simple<string>;
  lastName: ev.simple<string>;
  age: number;
}

// you render from this
type myState = {
  firstName: string,
  lastName: string,
  age: number,  // needs to be manually updated, not an attribute!
}

// normal "top down" data flow from parent to child
type myProps = {
  model: myModel,
}

// no HOC needed!
class MyComponent<myProps, myState> {
  state: myState = {firstName:'',lastName:'',age:0};
  // ...
}
```

At this point you have done the equivalent of these operations with Redux:
* defined the state for your component to work on (state for slice)
* defined your action(s) (not nedeed!)
* defined your `mapDispatchToProps` (not needed!)
* defined your reducer(s) (although this is a trivial example, the identity reducer)

There are only two other concepts to deal with evalvite, both of which are
analogous, but much simpler, than their Redux counterparts.

First, you have to "bind" your model to your component. This is roughly the
analogue of `mapStateToProps`, although it's probably better described as
"mapModelPropToState".  You do this in
your `ComponentDidMount()` method.  Continuing the example from above:

```typescript
class MyComponent<myProps, myState> {
  state: myState = {firstName:'',lastName:'',age:0};
  componentDidMount() {
    bindModelToComponent<myModel>(this.props.model,this);
  }
  // ...
}
```

This single line tells evalvite that your model instance (`this.props.model`) should
update the `state` property of the given React component (`this`). 

## Computed attributes
The power of a data-driven model like Redux or evalvite is that you can derive
or _compute_ on one bit of data from another, and the infrastructure provided keeps things
up to date without you doing any work.  Let's define a silly, but demonstrative,
computed property.  To do this, we'll change our state and model slightly:

```typescript
// you render from this
type myState = {
  firstName: string,
  lastName: string,
  frenchLastName: string,
  age: number,  // remember, not maintained by evalvite
}

class myModel {
  firstName : ev.simple<string> = new ev.simple(''); // intial value
  lastName: ev.simple<string> = new ev.simple(''); // initial value
  frenchLastName: ev.computed<string>;
  age: number = 82;
  constructor() {
    this.frenchLastName = new ev.computed<string>(
      (confusingLastName:string)=> confusingLastName.get().toUppercase(), // note the 'get'!
      [this.lastName]
    );
  }
}
```
> In France, it's not necessarily clear if you should write your last or family name
> first or your first or given name first, thus on business cards and important 
> documents, the last name is fully capitalized.  For example, JEAN Louis is clear but
> Jean Louis is not.

You'll notice that there is a simple typescript function that is called whenever
the value of the `frenchLastName` is needed; this is usually called "demanding", "requesting",  or
"calling for" its value.  You'll notice that an array of references are provided as
the second parameter to the constructor.  These must be _exclusively_ other attributes
and they map one-to-one, in order, with the parameters to the given function.
If you were to pass non-attribute values into the function, you would asking for
trouble as your function for a computed attribute should be a pure function of its 
inputs.  (Using constants is ok, if you must.)

You will notice that attributes require you to call `get()` to obtain their
true values.  Similarly, you have to use `set(value)` to change the value of
a simple attribute.  This may seem annoying as you read this, but in practice
is little or no problem.  First, the `render()` function uses `this.state` for
display, and those are simple objects, not attributes.  Second, the typescript
compiler will barf on you if you attempt to access or change the value of an 
attribute without using `get()` or `set()`.  

For example, this the change handler for a checkbox in some application.  The
checkbox controls the "done" attribute of this component's model:
```typescript
  change = ():void => {
    const {done} = this.props.model;
    done.set(!done.get());
  }
```
To repeat, your `render()` function should use the state, everything else
should be changing values in the *model*.


>For the careful reader, what do you think will happen if you try to call
>```typescript
>this.frenchLastName.set('CHIRAC');  // or, worse, 'chirac'?
>```
>?

There are _no_ restrictions on where the input attributes to your computed attribute's 
function are from.  They just have to be attributes; naturally, you can compute computed
attributes from other computed attributes.  (Perhaps `chineseLastName` could
be derived from `frenchLastName` to display PinYin?)  It is customary to keep all the
app state together in a file called `store.ts` with a single Model called
`AppModel` that is used by your `<App/>` and whose various pieces are passed
down to the appropriate components, but that is mostly for laughs at
Redux's expense.  

With this in place, we can modify the `lastName` value and the change
will appear automatically when you request the value of `frenchLastName`.   
When you change a value, in theory, computations are not immediately done to
update the _dependent_ values.  Thus, if you repeatedly modify `lastName` in this
example, only the _last_ one will be used to compute `frenchLastName` when it
is finally requested and there is only a single call to the function that 
converts the text to uppercase.  Thus, the computation of `frenchLastName` is _lazy_.  In
practice, however, there are almost no situations  with React components 
where this benefit can be reaped.  (The React rendering model depends
heavily on `render()` being a simple, pure function of props and state,
and thus the state must be available before `render()` is called and
evalvite has no way of knowing if `render()` _will_ be called.  If you wanted to be
more "lazy" you could move the state updating part of evalvite into the
`render()` path--"just in time" state computation--but this has not been done as 
it seems antithetical to the React philosophy.)

### Rendering
Your `render()` function should exclusively use the state defined when
you created your component and of course whatever props have been provided.

><h3> You are now done.  You can use this tool right now, you don't need
>a book and 12 tutorials of varying quality to figure out the rest. </h3>

## Minor notes on models
Your model should be a type with fields.  Thus, this model is not valid:
```typescript
type myModel = ev.simple<number>;
```
This would have to be written as:
```typescript
type myModel = {
  someField: ev.simple<number>,
}
```
The reason for this restriction is that React defines it's state variable as
single-level object.  Since we push the values of the model's fields into state
with the same names, we constrained by React's choice.

It is customary to just use simple values in the model, rather than trying 
use the modifiers `public`, `private`, etc.  Although this is possible (see
"Using a class as an interface" in the typescript docs), it seems like overkill.

## A fun example
Since we've shown you how props, state, and model are related above, so
we'll just show you a model here:

```typescript
type Age = {
  name: string, 
  years: ev.simple<number>,
  alive: ev.simple<boolean>,
}

class myModel  {
  values: ev.array<Age> = new ev.array<Age>();
  oldestLiving: ev.computed<number>;
  constructor() {
    this.oldestLiving = new ev.computed((ages: Age[])=>{
      let result = -1; // -1 means nobody is alive
      for (let i=0; i<ages.length; i=i+1) {
        if (ages[i].alive && ages[i].years>result) {
          result = ages[i].years
        }
      }
      return result
    }, [this.values]);
  }
}

```
This example shows how to use an `ev.array` attribute.  This attribute contains
the entire array of `Age` types.  If there are changes to either the number of elements
in the array, or the values of the attributes on Age within any member of the array,
you will get a correct result when you request `oldestLiving`.  It's worth noting
that as shown above, changes that are made to the `name` field of any member of the
array do *not* cause any change in the value of oldestLiving.  Just because 
grandma got married at 90 and changed her name, it doesn't change the oldest
living member of the family.
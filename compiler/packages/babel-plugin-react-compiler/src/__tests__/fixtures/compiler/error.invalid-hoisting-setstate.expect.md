
## Input

```javascript
// @enableNewMutationAliasingModel
import {useEffect, useState} from 'react';
import {Stringify} from 'shared-runtime';

function Foo() {
  /**
   * Previously, this lowered to
   * $1 = LoadContext capture setState
   * $2 = FunctionExpression deps=$1 context=setState
   *  [[ at this point, we freeze the `LoadContext setState` instruction, but it will never be referenced again ]]
   *
   * Now, this function expression directly references `setState`, which freezes
   * the source `DeclareContext HoistedConst setState`. Freezing source identifiers
   * (instead of the one level removed `LoadContext`) is more semantically correct
   * for everything *other* than hoisted context declarations.
   *
   * $2 = Function context=setState
   */
  useEffect(() => setState(2), []);

  const [state, setState] = useState(0);
  return <Stringify state={state} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```


## Error

```
Found 1 error:

Error: Cannot access variable before it is declared

Reading a variable before it is initialized will prevent the earlier access from updating when this value changes over time. Instead, move the variable access to after it has been initialized.

error.invalid-hoisting-setstate.ts:19:18
  17 |    * $2 = Function context=setState
  18 |    */
> 19 |   useEffect(() => setState(2), []);
     |                   ^^^^^^^^ `setState` is accessed before it is declared
  20 |
  21 |   const [state, setState] = useState(0);
  22 |   return <Stringify state={state} />;

error.invalid-hoisting-setstate.ts:21:16
  19 |   useEffect(() => setState(2), []);
  20 |
> 21 |   const [state, setState] = useState(0);
     |                 ^^^^^^^^ `setState` is declared here
  22 |   return <Stringify state={state} />;
  23 | }
  24 |
```
          
      
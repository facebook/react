
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
  19 |   useEffect(() => setState(2), []);
  20 |
> 21 |   const [state, setState] = useState(0);
     |                 ^^^^^^^^ InvalidReact: Updating a value used previously in an effect function or as an effect dependency is not allowed. Consider moving the mutation before calling useEffect(). Found mutation of `setState` (21:21)
  22 |   return <Stringify state={state} />;
  23 | }
  24 |
```
          
      
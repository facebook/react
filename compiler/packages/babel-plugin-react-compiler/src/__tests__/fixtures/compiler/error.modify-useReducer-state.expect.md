
## Input

```javascript
import {useReducer} from 'react';

function Foo() {
  let [state, setState] = useReducer({foo: 1});
  state.foo = 1;
  return state;
}

```


## Error

```
Found 1 error:
Error: Mutating a value returned from 'useReducer()', which should not be mutated. Use the dispatch function to update instead

error.modify-useReducer-state.ts:5:2
  3 | function Foo() {
  4 |   let [state, setState] = useReducer({foo: 1});
> 5 |   state.foo = 1;
    |   ^^^^^ Mutating a value returned from 'useReducer()', which should not be mutated. Use the dispatch function to update instead
  6 |   return state;
  7 | }
  8 |


```
          
      
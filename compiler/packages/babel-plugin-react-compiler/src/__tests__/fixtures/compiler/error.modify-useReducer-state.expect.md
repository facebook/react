
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
  3 | function Foo() {
  4 |   let [state, setState] = useReducer({foo: 1});
> 5 |   state.foo = 1;
    |   ^^^^^ InvalidReact: Mutating a value returned from 'useReducer()', which should not be mutated. Use the dispatch function to update instead (5:5)
  6 |   return state;
  7 | }
  8 |
```
          
      
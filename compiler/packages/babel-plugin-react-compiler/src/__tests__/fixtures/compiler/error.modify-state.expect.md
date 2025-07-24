
## Input

```javascript
import {useState} from 'react';

function Foo() {
  let [state, setState] = useState({});
  state.foo = 1;
  return state;
}

```


## Error

```
Found 1 error:
Error: Mutating a value returned from 'useState()', which should not be mutated. Use the setter function to update instead

error.modify-state.ts:5:2
  3 | function Foo() {
  4 |   let [state, setState] = useState({});
> 5 |   state.foo = 1;
    |   ^^^^^ Mutating a value returned from 'useState()', which should not be mutated. Use the setter function to update instead
  6 |   return state;
  7 | }
  8 |


```
          
      
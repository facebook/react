
## Input

```javascript
import {useState} from 'react';

function Foo() {
  const [state, setState] = useState({foo: {bar: 3}});
  const foo = state.foo;
  foo.bar = 1;
  return state;
}

```


## Error

```
  4 |   const [state, setState] = useState({foo: {bar: 3}});
  5 |   const foo = state.foo;
> 6 |   foo.bar = 1;
    |   ^^^ InvalidReact: Mutating a value returned from 'useState()', which should not be mutated. Use the setter function to update instead (6:6)
  7 |   return state;
  8 | }
  9 |
```
          
      
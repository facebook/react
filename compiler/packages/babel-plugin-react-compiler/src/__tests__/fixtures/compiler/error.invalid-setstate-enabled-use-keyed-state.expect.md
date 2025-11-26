
## Input

```javascript
// @validateNoSetStateInRender @enableUseKeyedState
import {useState} from 'react';

function Component() {
  const [total, setTotal] = useState(0);
  setTotal(42);
  return total;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};

```


## Error

```
Found 1 error:

Error: Calling setState during render may trigger an infinite loop

Use useKeyedState instead of calling setState directly in render. Example: const [value, setValue] = useKeyedState(initialValue, key).

error.invalid-setstate-enabled-use-keyed-state.ts:6:2
  4 | function Component() {
  5 |   const [total, setTotal] = useState(0);
> 6 |   setTotal(42);
    |   ^^^^^^^^ Found setState() in render
  7 |   return total;
  8 | }
  9 |
```
          
      
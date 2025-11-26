
## Input

```javascript
// @validateNoSetStateInRender
import {useState} from 'react';

function Component() {
  const [total, setTotal] = useState(0);
  setTotal({count: 42});
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

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState).

error.invalid-setstate-object-no-keyed-state.ts:6:2
  4 | function Component() {
  5 |   const [total, setTotal] = useState(0);
> 6 |   setTotal({count: 42});
    |   ^^^^^^^^ Found setState() in render
  7 |   return total;
  8 | }
  9 |
```
          
      

## Input

```javascript
//@flow
import {useRef} from 'react';

component C() {
  const r = useRef(null);
  if (r.current == null) {
    r.current = 1;
  }
  r.current = 1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{}],
};

```


## Error

```
Found 1 error:

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

   7 |     r.current = 1;
   8 |   }
>  9 |   r.current = 1;
     |   ^ Cannot mutate ref during render
  10 | }
  11 |
  12 | export const FIXTURE_ENTRYPOINT = {

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      
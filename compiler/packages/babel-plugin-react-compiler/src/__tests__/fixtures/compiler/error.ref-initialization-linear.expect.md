
## Input

```javascript
//@flow
import {useRef} from 'react';

component C() {
  const r = useRef(null);
  if (r.current == null) {
    r.current = 42;
    r.current = 42;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{}],
};

```


## Error

```
Found 2 errors:

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

   5 |   const r = useRef(null);
   6 |   if (r.current == null) {
>  7 |     r.current = 42;
     |     ^ Cannot mutate ref during render
   8 |     r.current = 42;
   9 |   }
  10 | }

Refs may be mutated during render if initialized with `if (ref.current == null)`

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

   6 |   if (r.current == null) {
   7 |     r.current = 42;
>  8 |     r.current = 42;
     |     ^ Cannot mutate ref during render
   9 |   }
  10 | }
  11 |

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      
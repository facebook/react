
## Input

```javascript
//@flow
import {useRef} from 'react';

component C() {
  const r = useRef(null);
  const guard = r.current == null;
  if (guard) {
    r.current = 1;
  }
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

   6 |   const guard = r.current == null;
   7 |   if (guard) {
>  8 |     r.current = 1;
     |     ^ Cannot mutate ref during render
   9 |   }
  10 | }
  11 |

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      
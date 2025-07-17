
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
Found 2 errors:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

  4 | component C() {
  5 |   const r = useRef(null);
> 6 |   const guard = r.current == null;
    |                 ^^^^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  7 |   if (guard) {
  8 |     r.current = 1;
  9 |   }

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

Cannot access ref value `guard`.

   5 |   const r = useRef(null);
   6 |   const guard = r.current == null;
>  7 |   if (guard) {
     |       ^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
   8 |     r.current = 1;
   9 |   }
  10 | }
```
          
      
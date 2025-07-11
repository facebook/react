
## Input

```javascript
//@flow
import {useRef} from 'react';

const DEFAULT_VALUE = 1;

component C() {
  const r = useRef(DEFAULT_VALUE);
  if (r.current == DEFAULT_VALUE) {
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

   6 | component C() {
   7 |   const r = useRef(DEFAULT_VALUE);
>  8 |   if (r.current == DEFAULT_VALUE) {
     |       ^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
   9 |     r.current = 1;
  10 |   }
  11 | }

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

   7 |   const r = useRef(DEFAULT_VALUE);
   8 |   if (r.current == DEFAULT_VALUE) {
>  9 |     r.current = 1;
     |     ^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  10 |   }
  11 | }
  12 |
```
          
      
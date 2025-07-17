
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
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

   6 |   if (r.current == null) {
   7 |     r.current = 42;
>  8 |     r.current = 42;
     |     ^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
   9 |   }
  10 | }
  11 |
```
          
      
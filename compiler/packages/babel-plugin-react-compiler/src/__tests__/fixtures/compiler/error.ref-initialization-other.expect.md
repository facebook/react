
## Input

```javascript
//@flow
import {useRef} from 'react';

component C() {
  const r = useRef(null);
  const r2 = useRef(null);
  if (r.current == null) {
    r2.current = 1;
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

   6 |   const r2 = useRef(null);
   7 |   if (r.current == null) {
>  8 |     r2.current = 1;
     |     ^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
   9 |   }
  10 | }
  11 |
```
          
      
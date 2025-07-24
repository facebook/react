
## Input

```javascript
//@flow
import {useRef} from 'react';

component C() {
  const r = useRef(null);
  if (r.current == null) {
    f(r);
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

   5 |   const r = useRef(null);
   6 |   if (r.current == null) {
>  7 |     f(r);
     |       ^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
   8 |   }
   9 | }
  10 |
```
          
      
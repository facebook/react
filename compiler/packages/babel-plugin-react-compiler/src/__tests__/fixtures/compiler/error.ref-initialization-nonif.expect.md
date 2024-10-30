
## Input

```javascript
//@flow
import {useRef} from 'react';

function C() {
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
  4 | function C() {
  5 |   const r = useRef(null);
> 6 |   const guard = r.current == null;
    |                 ^^^^^^^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (6:6)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value `guard` (7:7)
  7 |   if (guard) {
  8 |     r.current = 1;
  9 |   }
```
          
      
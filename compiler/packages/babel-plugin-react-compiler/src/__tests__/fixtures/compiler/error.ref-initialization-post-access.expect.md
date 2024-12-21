
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
   7 |     r.current = 1;
   8 |   }
>  9 |   r.current = 1;
     |   ^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (9:9)
  10 | }
  11 |
  12 | export const FIXTURE_ENTRYPOINT = {
```
          
      
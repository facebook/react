
## Input

```javascript
//@flow
import {useRef} from 'react';

component C() {
  const r = useRef(null);
  const current = !r.current;
  return <div>{current}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{}],
};

```


## Error

```
Found 1 error:

Error: Cannot access ref value during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

   5 |   const r = useRef(null);
   6 |   const current = !r.current;
>  7 |   return <div>{current}</div>;
     |                ^^^^^^^ Ref value is used during render
   8 | }
   9 |
  10 | export const FIXTURE_ENTRYPOINT = {

  4 | component C() {
  5 |   const r = useRef(null);
> 6 |   const current = !r.current;
    |                    ^^^^^^^^^ Ref is initially accessed
  7 |   return <div>{current}</div>;
  8 | }
  9 |
```
          
      
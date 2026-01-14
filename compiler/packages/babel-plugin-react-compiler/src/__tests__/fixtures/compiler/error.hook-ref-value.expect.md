
## Input

```javascript
import {useEffect, useRef} from 'react';

function Component(props) {
  const ref = useRef();
  useEffect(() => {}, [ref.current]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```


## Error

```
Found 1 error:

Error: Cannot access ref value during render

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.hook-ref-value.ts:5:22
  3 | function Component(props) {
  4 |   const ref = useRef();
> 5 |   useEffect(() => {}, [ref.current]);
    |                       ^^^^^^^^^^^^^ Ref value is used during render
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPOINT = {

error.hook-ref-value.ts:5:23
  3 | function Component(props) {
  4 |   const ref = useRef();
> 5 |   useEffect(() => {}, [ref.current]);
    |                        ^^^^^^^^^^^ Ref is initially accessed
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPOINT = {
```
          
      
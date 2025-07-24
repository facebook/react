
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
Found 2 errors:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.hook-ref-value.ts:5:23
  3 | function Component(props) {
  4 |   const ref = useRef();
> 5 |   useEffect(() => {}, [ref.current]);
    |                        ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPOINT = {

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.hook-ref-value.ts:5:23
  3 | function Component(props) {
  4 |   const ref = useRef();
> 5 |   useEffect(() => {}, [ref.current]);
    |                        ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPOINT = {
```
          
      
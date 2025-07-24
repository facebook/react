
## Input

```javascript
import {useRef} from 'react';

function Component(props) {
  const ref = useRef();
  return ref?.current;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```


## Error

```
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.ref-optional.ts:5:9
  3 | function Component(props) {
  4 |   const ref = useRef();
> 5 |   return ref?.current;
    |          ^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPOINT = {
```
          
      
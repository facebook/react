
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
  3 | function Component(props) {
  4 |   const ref = useRef();
> 5 |   useEffect(() => {}, [ref.current]);
    |                        ^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (5:5)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (5:5)
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPOINT = {
```
          
      
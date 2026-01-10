
## Input

```javascript
import {useRef, useState} from 'react';

function Component(props) {
  const ref = useRef(props.value);
  const [state] = useState(() => ref.current);

  return <Stringify state={state} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};

```


## Error

```
Found 2 errors:

Error: Cannot access ref value during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

error.invalid-access-ref-in-state-initializer.ts:5:27
  3 | function Component(props) {
  4 |   const ref = useRef(props.value);
> 5 |   const [state] = useState(() => ref.current);
    |                            ^^^^^^^^^^^^^^^^^ Ref value is used during render
  6 |
  7 |   return <Stringify state={state} />;
  8 | }

Error: Cannot access ref value during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

error.invalid-access-ref-in-state-initializer.ts:7:27
   5 |   const [state] = useState(() => ref.current);
   6 |
>  7 |   return <Stringify state={state} />;
     |                            ^^^^^ Ref value is used during render
   8 | }
   9 |
  10 | export const FIXTURE_ENTRYPOINT = {

error.invalid-access-ref-in-state-initializer.ts:5:27
  3 | function Component(props) {
  4 |   const ref = useRef(props.value);
> 5 |   const [state] = useState(() => ref.current);
    |                            ^^^^^^^^^^^^^^^^^ Ref is initially accessed
  6 |
  7 |   return <Stringify state={state} />;
  8 | }
```
          
      

## Input

```javascript
import {useReducer, useRef} from 'react';

function Component(props) {
  const ref = useRef(props.value);
  const [state] = useReducer(() => ref.current, null);

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

error.invalid-access-ref-in-reducer.ts:5:29
  3 | function Component(props) {
  4 |   const ref = useRef(props.value);
> 5 |   const [state] = useReducer(() => ref.current, null);
    |                              ^^^^^^^^^^^^^^^^^ Ref value is used during render
  6 |
  7 |   return <Stringify state={state} />;
  8 | }

Error: Cannot access ref value during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

error.invalid-access-ref-in-reducer.ts:7:27
   5 |   const [state] = useReducer(() => ref.current, null);
   6 |
>  7 |   return <Stringify state={state} />;
     |                            ^^^^^ Ref value is used during render
   8 | }
   9 |
  10 | export const FIXTURE_ENTRYPOINT = {

error.invalid-access-ref-in-reducer.ts:5:29
  3 | function Component(props) {
  4 |   const ref = useRef(props.value);
> 5 |   const [state] = useReducer(() => ref.current, null);
    |                              ^^^^^^^^^^^^^^^^^ Ref is initially accessed
  6 |
  7 |   return <Stringify state={state} />;
  8 | }
```
          
      
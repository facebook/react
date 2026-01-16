
## Input

```javascript
import {useReducer, useRef} from 'react';

function Component(props) {
  const ref = useRef(props.value);
  const [state] = useReducer(
    (state, action) => state + action,
    0,
    init => ref.current
  );

  return <Stringify state={state} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};

```


## Error

```
Found 1 error:

Error: Cannot access ref value during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

error.invalid-access-ref-in-reducer-init.ts:8:4
   6 |     (state, action) => state + action,
   7 |     0,
>  8 |     init => ref.current
     |     ^^^^^^^^^^^^^^^^^^^ Ref value is used during render
   9 |   );
  10 |
  11 |   return <Stringify state={state} />;

error.invalid-access-ref-in-reducer-init.ts:8:12
   6 |     (state, action) => state + action,
   7 |     0,
>  8 |     init => ref.current
     |             ^^^^^^^^^^^ Ref is initially accessed
   9 |   );
  10 |
  11 |   return <Stringify state={state} />;
```
          
      
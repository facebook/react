
## Input

```javascript
import {useRef} from 'react';
import {Stringify} from 'shared-runtime';

function Component(props) {
  const ref = useRef(props.value);
  const object = {};
  object.foo = () => ref.current;
  return <Stringify object={object} shouldInvokeFns={true} />;
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

error.invalid-capturing-ref-returning-function-in-rendered-object.ts:8:28
   6 |   const object = {};
   7 |   object.foo = () => ref.current;
>  8 |   return <Stringify object={object} shouldInvokeFns={true} />;
     |                             ^^^^^^ Ref value is used during render
   9 | }
  10 |
  11 | export const FIXTURE_ENTRYPOINT = {

error.invalid-capturing-ref-returning-function-in-rendered-object.ts:7:21
   5 |   const ref = useRef(props.value);
   6 |   const object = {};
>  7 |   object.foo = () => ref.current;
     |                      ^^^^^^^^^^^ Ref is initially accessed
   8 |   return <Stringify object={object} shouldInvokeFns={true} />;
   9 | }
  10 |
```
          
      
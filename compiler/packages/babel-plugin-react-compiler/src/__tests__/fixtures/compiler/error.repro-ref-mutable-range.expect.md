
## Input

```javascript
import {Stringify, identity, mutate, CONST_TRUE} from 'shared-runtime';

function Foo(props, ref) {
  const value = {};
  if (CONST_TRUE) {
    mutate(value);
    return <Stringify ref={ref} />;
  }
  mutate(value);
  if (CONST_TRUE) {
    return <Stringify ref={identity(ref)} />;
  }
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}, {current: 'fake-ref-object'}],
};

```


## Error

```
Found 1 error:

Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef)

error.repro-ref-mutable-range.ts:11:36
   9 |   mutate(value);
  10 |   if (CONST_TRUE) {
> 11 |     return <Stringify ref={identity(ref)} />;
     |                                     ^^^ Passing a ref to a function may read its value during render
  12 |   }
  13 |   return value;
  14 | }
```
          
      
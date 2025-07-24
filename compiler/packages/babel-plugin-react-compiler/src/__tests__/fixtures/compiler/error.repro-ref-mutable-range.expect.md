
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

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.repro-ref-mutable-range.ts:11:36
   9 |   mutate(value);
  10 |   if (CONST_TRUE) {
> 11 |     return <Stringify ref={identity(ref)} />;
     |                                     ^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  12 |   }
  13 |   return value;
  14 | }
```
          
      
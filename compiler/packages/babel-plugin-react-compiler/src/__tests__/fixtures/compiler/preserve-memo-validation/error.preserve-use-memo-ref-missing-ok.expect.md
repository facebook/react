
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback, useRef} from 'react';

function useFoo() {
  const ref = useRef<undefined | (() => undefined)>();

  return useCallback(() => {
    if (ref != null) {
      ref.current();
    }
  }, []);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```


## Error

```
   5 |   const ref = useRef<undefined | (() => undefined)>();
   6 |
>  7 |   return useCallback(() => {
     |          ^^^^^^^^^^^^^^^^^^^
>  8 |     if (ref != null) {
     | ^^^^^^^^^^^^^^^^^^^^^^
>  9 |       ref.current();
     | ^^^^^^^^^^^^^^^^^^^^^^
> 10 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^
> 11 |   }, []);
     | ^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at freeze $35:TObject<BuiltInFunction> (7:11)
  12 | }
  13 |
  14 | export const FIXTURE_ENTRYPOINT = {
```
          
      
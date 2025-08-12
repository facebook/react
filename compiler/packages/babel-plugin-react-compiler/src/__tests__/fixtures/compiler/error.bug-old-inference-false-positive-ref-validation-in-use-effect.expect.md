
## Input

```javascript
// @validateNoFreezingKnownMutableFunctions @enableNewMutationAliasingModel:false

import {useCallback, useEffect, useRef} from 'react';
import {useHook} from 'shared-runtime';

function Component() {
  const params = useHook();
  const update = useCallback(
    partialParams => {
      const nextParams = {
        ...params,
        ...partialParams,
      };
      nextParams.param = 'value';
      console.log(nextParams);
    },
    [params]
  );
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current === null) {
      update();
    }
  }, [update]);

  return 'ok';
}

```


## Error

```
Found 1 error:

Error: Cannot modify local variables after render completes

This argument is a function which may reassign or mutate a local variable after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead.

error.bug-old-inference-false-positive-ref-validation-in-use-effect.ts:20:12
  18 |   );
  19 |   const ref = useRef(null);
> 20 |   useEffect(() => {
     |             ^^^^^^^
> 21 |     if (ref.current === null) {
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 22 |       update();
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 23 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 24 |   }, [update]);
     | ^^^^ This function may (indirectly) reassign or modify a local variable after render
  25 |
  26 |   return 'ok';
  27 | }

error.bug-old-inference-false-positive-ref-validation-in-use-effect.ts:14:6
  12 |         ...partialParams,
  13 |       };
> 14 |       nextParams.param = 'value';
     |       ^^^^^^^^^^ This modifies a local variable
  15 |       console.log(nextParams);
  16 |     },
  17 |     [params]
```
          
      
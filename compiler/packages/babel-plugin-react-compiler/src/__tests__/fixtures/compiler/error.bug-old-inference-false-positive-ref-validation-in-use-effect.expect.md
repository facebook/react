
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
     | ^^^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (20:24)

InvalidReact: The function modifies a local variable here (14:14)
  25 |
  26 |   return 'ok';
  27 | }
```
          
      
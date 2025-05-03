
## Input

```javascript
// @validateNoFreezingKnownMutableFunctions

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
  12 |         ...partialParams,
  13 |       };
> 14 |       nextParams.param = 'value';
     |       ^^^^^^^^^^ InvalidReact: Mutating a value returned from a function whose return value should not be mutated. Found mutation of `params` (14:14)
  15 |       console.log(nextParams);
  16 |     },
  17 |     [params]
```
          
      
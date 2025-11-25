
## Input

```javascript
// @validateExhaustiveMemoizationDependencies

import {useState} from 'react';
import {Stringify} from 'shared-runtime';

function Component() {
  const [state, setState] = useState(0);
  const x = useMemo(() => {
    return [state];
    // error: `setState` is a stable type, but not actually referenced
  }, [state, setState]);

  return 'oops';
}

```


## Error

```
Found 1 error:

Error: Found unnecessary memoization dependencies

Unnecessary dependencies can cause a value to update more often than necessary, causing performance regressions and effects to fire more often than expected.

error.invalid-exhaustive-deps-disallow-unused-stable-types.ts:11:5
   9 |     return [state];
  10 |     // error: `setState` is a stable type, but not actually referenced
> 11 |   }, [state, setState]);
     |      ^^^^^^^^^^^^^^^^^ Unnecessary dependencies `setState`
  12 |
  13 |   return 'oops';
  14 | }
```
          
      
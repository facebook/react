
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import {useEffect, AUTODEPS} from 'react';

function Component({propVal}) {
  'use no memo';
  useEffect(() => [propVal], AUTODEPS);
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.use-no-memo.ts:6:2
  4 | function Component({propVal}) {
  5 |   'use no memo';
> 6 |   useEffect(() => [propVal], AUTODEPS);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  7 | }
  8 |
```
          
      
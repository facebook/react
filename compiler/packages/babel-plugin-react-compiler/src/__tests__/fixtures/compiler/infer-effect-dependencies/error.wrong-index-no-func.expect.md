
## Input

```javascript
// @inferEffectDependencies
import {useEffect, AUTODEPS} from 'react';

function Component({foo}) {
  useEffect(AUTODEPS);
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.wrong-index-no-func.ts:5:2
  3 |
  4 | function Component({foo}) {
> 5 |   useEffect(AUTODEPS);
    |   ^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  6 | }
  7 |
```
          
      
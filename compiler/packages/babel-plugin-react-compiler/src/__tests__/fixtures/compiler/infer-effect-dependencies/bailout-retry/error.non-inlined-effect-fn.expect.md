
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import {useEffect, AUTODEPS} from 'react';

/**
 * Error on non-inlined effect functions:
 * 1. From the effect hook callee's perspective, it only makes sense
 *    to either
 *    (a) never hard error (i.e. failing to infer deps is acceptable) or
 *    (b) always hard error,
 *    regardless of whether the callback function is an inline fn.
 * 2. (Technical detail) it's harder to support detecting cases in which
 *    function (pre-Forget transform) was inline but becomes memoized
 */
function Component({foo}) {
  function f() {
    console.log(foo);
  }

  // No inferred dep array, the argument is not a lambda
  useEffect(f, AUTODEPS);
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.non-inlined-effect-fn.ts:20:2
  18 |
  19 |   // No inferred dep array, the argument is not a lambda
> 20 |   useEffect(f, AUTODEPS);
     |   ^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  21 | }
  22 |
```
          
      

## Input

```javascript
// @inferEffectDependencies @panicThreshold(none)
import {useEffect} from 'react';

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
  useEffect(f);
}

```


## Error

```
  18 |
  19 |   // No inferred dep array, the argument is not a lambda
> 20 |   useEffect(f);
     |   ^^^^^^^^^^^^ InvalidReact: [InferEffectDeps] Untransformed reference to compiler-required feature. Either remove this call or ensure it is successfully transformed by the compiler (20:20)
  21 | }
  22 |
```
          
      
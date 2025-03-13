
## Input

```javascript
// @inferEffectDependencies @panicThreshold(none)
import {useRef} from 'react';
import {useSpecialEffect} from 'shared-runtime';

/**
 * The retry pipeline disables memoization features, which means we need to
 * provide an alternate implementation of effect dependencies which does not
 * rely on memoization.
 */
function useFoo({cond}) {
  const ref = useRef();
  const derived = cond ? ref.current : makeObject();
  useSpecialEffect(() => {
    log(derived);
  }, [derived]);
  return ref;
}

```


## Error

```
  11 |   const ref = useRef();
  12 |   const derived = cond ? ref.current : makeObject();
> 13 |   useSpecialEffect(() => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^
> 14 |     log(derived);
     | ^^^^^^^^^^^^^^^^^
> 15 |   }, [derived]);
     | ^^^^^^^^^^^^^^^^ InvalidReact: [Fire] Untransformed reference to compiler-required feature. Either remove this call or ensure it is successfully transformed by the compiler. (Bailout reason: Invariant: Expected function expression scope to exist (13:15)) (13:15)
  16 |   return ref;
  17 | }
  18 |
```
          
      
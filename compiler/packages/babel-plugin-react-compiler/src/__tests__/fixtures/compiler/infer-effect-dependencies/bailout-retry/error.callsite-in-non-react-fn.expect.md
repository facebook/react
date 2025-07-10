
## Input

```javascript
// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import {useEffect} from 'react';

function nonReactFn(arg) {
  useEffect(() => [1, 2, arg]);
}

```


## Error

```
Found 1 errors:
InvalidReact: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.callsite-in-non-react-fn.ts:5:2
  3 |
  4 | function nonReactFn(arg) {
> 5 |   useEffect(() => [1, 2, arg]);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  6 | }
  7 |
```
          
      
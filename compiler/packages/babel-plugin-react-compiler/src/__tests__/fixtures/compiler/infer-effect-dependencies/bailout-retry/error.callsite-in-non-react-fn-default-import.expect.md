
## Input

```javascript
// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import useMyEffect from 'useEffectWrapper';
import {AUTODEPS} from 'react';

function nonReactFn(arg) {
  useMyEffect(() => [1, 2, arg], AUTODEPS);
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.callsite-in-non-react-fn-default-import.ts:6:2
  4 |
  5 | function nonReactFn(arg) {
> 6 |   useMyEffect(() => [1, 2, arg], AUTODEPS);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  7 | }
  8 |
```
          
      
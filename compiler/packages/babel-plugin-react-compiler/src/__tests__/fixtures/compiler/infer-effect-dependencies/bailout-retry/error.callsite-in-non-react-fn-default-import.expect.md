
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
  4 |
  5 | function nonReactFn(arg) {
> 6 |   useMyEffect(() => [1, 2, arg], AUTODEPS);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (6:6)
  7 | }
  8 |
```
          
      
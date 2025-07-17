
## Input

```javascript
// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import {useEffect, AUTODEPS} from 'react';

function nonReactFn(arg) {
  useEffect(() => [1, 2, arg], AUTODEPS);
}

```


## Error

```
  3 |
  4 | function nonReactFn(arg) {
> 5 |   useEffect(() => [1, 2, arg], AUTODEPS);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (5:5)
  6 | }
  7 |
```
          
      
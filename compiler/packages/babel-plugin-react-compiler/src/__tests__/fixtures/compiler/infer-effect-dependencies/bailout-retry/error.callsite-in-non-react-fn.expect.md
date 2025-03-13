
## Input

```javascript
// @inferEffectDependencies @compilationMode(infer) @panicThreshold(none)
import {useEffect} from 'react';

function nonReactFn(arg) {
  useEffect(() => [1, 2, arg]);
}

```


## Error

```
  3 |
  4 | function nonReactFn(arg) {
> 5 |   useEffect(() => [1, 2, arg]);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [Fire] Untransformed reference to compiler-required feature. Either remove this call or ensure it is successfully transformed by the compiler (5:5)
  6 | }
  7 |
```
          
      
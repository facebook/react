
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
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Todo: Untransformed reference to experimental compiler-only feature (5:5)
  6 | }
  7 |
```
          
      
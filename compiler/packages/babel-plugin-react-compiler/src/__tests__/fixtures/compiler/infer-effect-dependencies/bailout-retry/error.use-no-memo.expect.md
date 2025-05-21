
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import {useEffect} from 'react';

function Component({propVal}) {
  'use no memo';
  useEffect(() => [propVal]);
}

```


## Error

```
  4 | function Component({propVal}) {
  5 |   'use no memo';
> 6 |   useEffect(() => [propVal]);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (6:6)
  7 | }
  8 |
```
          
      
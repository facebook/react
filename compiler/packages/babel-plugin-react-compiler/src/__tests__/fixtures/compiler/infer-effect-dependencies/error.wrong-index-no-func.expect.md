
## Input

```javascript
// @inferEffectDependencies
import {useEffect, AUTODEPS} from 'react';

function Component({foo}) {
  useEffect(AUTODEPS);
}

```


## Error

```
  3 |
  4 | function Component({foo}) {
> 5 |   useEffect(AUTODEPS);
    |   ^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (5:5)
  6 | }
  7 |
```
          
      

## Input

```javascript
// @inferEffectDependencies @panicThreshold(none)
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
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [Fire] Untransformed reference to compiler-required feature. Either remove this call or ensure it is successfully transformed by the compiler (6:6)
  7 | }
  8 |
```
          
      
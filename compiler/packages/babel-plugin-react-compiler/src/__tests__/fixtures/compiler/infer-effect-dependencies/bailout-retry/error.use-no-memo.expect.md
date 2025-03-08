
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
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^ Todo: Untransformed reference to experimental compiler-only feature (6:6)
  7 | }
  8 |
```
          
      

## Input

```javascript
// @enableFire @panicThreshold(none)
import {fire} from 'react';

console.log(fire == null);

```


## Error

```
  2 | import {fire} from 'react';
  3 |
> 4 | console.log(fire == null);
    |             ^^^^ Todo: Untransformed reference to experimental compiler-only feature (4:4)
  5 |
```
          
      
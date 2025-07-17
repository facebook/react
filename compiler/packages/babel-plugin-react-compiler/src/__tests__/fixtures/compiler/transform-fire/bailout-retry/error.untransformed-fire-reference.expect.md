
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {fire} from 'react';

console.log(fire == null);

```


## Error

```
Found 1 error:

Error: [Fire] Untransformed reference to compiler-required feature.

 null

error.untransformed-fire-reference.ts:4:12
  2 | import {fire} from 'react';
  3 |
> 4 | console.log(fire == null);
    |             ^^^^ Untransformed `fire` call
  5 |
```
          
      
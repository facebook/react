
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {fire} from 'react';

console.log(fire == null);

```


## Error

```
  2 | import {fire} from 'react';
  3 |
> 4 | console.log(fire == null);
    |             ^^^^ InvalidReact: [Fire] Untransformed reference to compiler-required feature. Either remove this `fire` call or ensure it is successfully transformed by the compiler (4:4)
  5 |
```
          
      
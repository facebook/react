
## Input

```javascript
// @validateExhaustiveEffectDependencies
import {useEffect} from 'react';

function Component({x, y, z}) {
  // error: missing dep - x
  useEffect(() => {
    console.log(x);
  }, []);

  // error: extra dep - y
  useEffect(() => {
    console.log(x);
  }, [x, y]);
}

```


## Error

```
Found 2 errors:

Error: Found missing/extra memoization dependencies

Missing dependencies can cause a value to update less often than it should, resulting in stale UI.

error.invalid-exhaustive-effect-deps.ts:7:16
   5 |   // error: missing dep - x
   6 |   useEffect(() => {
>  7 |     console.log(x);
     |                 ^ Missing dependency `x`
   8 |   }, []);
   9 |
  10 |   // error: extra dep - y

Error: Found missing/extra memoization dependencies

Extra dependencies can cause a value to update more often than it should, resulting in performance problems such as excessive renders or effects firing too often.

error.invalid-exhaustive-effect-deps.ts:13:9
  11 |   useEffect(() => {
  12 |     console.log(x);
> 13 |   }, [x, y]);
     |          ^ Unnecessary dependency `y`
  14 | }
  15 |
```
          
      
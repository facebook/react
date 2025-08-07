
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {fire} from 'react';

/**
 * TODO: we should eventually distinguish between `use no memo` and `use no
 * compiler` directives. The former should be used to *only* disable memoization
 * features.
 */
function Component({props, bar}) {
  'use no memo';
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
    fire(foo());
    fire(bar());
  });

  return null;
}

```


## Error

```
Found 1 error:

Error: [Fire] Untransformed reference to compiler-required feature.

 null

error.use-no-memo.ts:15:4
  13 |   };
  14 |   useEffect(() => {
> 15 |     fire(foo(props));
     |     ^^^^ Untransformed `fire` call
  16 |     fire(foo());
  17 |     fire(bar());
  18 |   });
```
          
      
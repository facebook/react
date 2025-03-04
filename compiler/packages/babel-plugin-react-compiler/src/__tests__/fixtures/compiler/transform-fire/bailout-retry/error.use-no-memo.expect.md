
## Input

```javascript
// @enableFire @panicThreshold(none)
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
  13 |   };
  14 |   useEffect(() => {
> 15 |     fire(foo(props));
     |     ^^^^ Todo: Untransformed reference to experimental compiler-only feature (15:15)
  16 |     fire(foo());
  17 |     fire(bar());
  18 |   });
```
          
      

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
     |     ^^^^ InvalidReact: [Fire] Untransformed reference to compiler-required feature. Either remove this `fire` call or ensure it is successfully transformed by the compiler. (Bailout reason: InvalidReact: Cannot compile `fire`. `fire(myFunction)` will not do anything on its own, you need to call the result like `fire(myFunction)(myArgument)` (15:15)

InvalidReact: Cannot compile `fire`. `fire(myFunction)` will not do anything on its own, you need to call the result like `fire(myFunction)(myArgument)` (16:16)

InvalidReact: Cannot compile `fire`. `fire(myFunction)` will not do anything on its own, you need to call the result like `fire(myFunction)(myArgument)` (17:17)) (15:15)
  16 |     fire(foo());
  17 |     fire(bar());
  18 |   });
```
          
      
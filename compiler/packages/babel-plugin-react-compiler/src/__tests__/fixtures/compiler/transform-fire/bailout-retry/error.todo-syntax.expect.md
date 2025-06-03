
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {fire} from 'react';

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * In practice, we expect to surface these as actionable errors to the user, in
 * the same way that invalid `fire` calls error.
 */
function Component({prop1}) {
  const foo = () => {
    try {
      console.log(prop1);
    } finally {
      console.log('jbrown215');
    }
  };
  useEffect(() => {
    fire(foo());
  });
}

```


## Error

```
  16 |   };
  17 |   useEffect(() => {
> 18 |     fire(foo());
     |     ^^^^ InvalidReact: [Fire] Untransformed reference to compiler-required feature. Either remove this `fire` call or ensure it is successfully transformed by the compiler. (Bailout reason: Todo: (BuildHIR::lowerStatement) Handle TryStatement without a catch clause (11:15)) (18:18)
  19 |   });
  20 | }
  21 |
```
          
      
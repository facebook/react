
## Input

```javascript
// @enableFire
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
   9 | function Component({prop1}) {
  10 |   const foo = () => {
> 11 |     try {
     |     ^^^^^
> 12 |       console.log(prop1);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 13 |     } finally {
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 14 |       console.log('jbrown215');
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 15 |     }
     | ^^^^^^ Todo: (BuildHIR::lowerStatement) Handle TryStatement without a catch clause (11:15)
  16 |   };
  17 |   useEffect(() => {
  18 |     fire(foo());
```
          
      
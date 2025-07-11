
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import {useSpecialEffect} from 'shared-runtime';

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * We should surface these as actionable lint / build errors to devs.
 */
function Component({prop1}) {
  'use memo';
  useSpecialEffect(() => {
    try {
      console.log(prop1);
    } finally {
      console.log('exiting');
    }
  }, [prop1]);
  return <div>{prop1}</div>;
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics. Todo: (BuildHIR::lowerStatement) Handle TryStatement without a catch clause (11:4)

error.todo-syntax.ts:10:2
   8 | function Component({prop1}) {
   9 |   'use memo';
> 10 |   useSpecialEffect(() => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^
> 11 |     try {
     | ^^^^^^^^^
> 12 |       console.log(prop1);
     | ^^^^^^^^^
> 13 |     } finally {
     | ^^^^^^^^^
> 14 |       console.log('exiting');
     | ^^^^^^^^^
> 15 |     }
     | ^^^^^^^^^
> 16 |   }, [prop1]);
     | ^^^^^^^^^^^^^^ Cannot infer dependencies
  17 |   return <div>{prop1}</div>;
  18 | }
  19 |
```
          
      
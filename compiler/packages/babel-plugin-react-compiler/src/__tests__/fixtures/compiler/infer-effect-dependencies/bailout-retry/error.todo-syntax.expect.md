
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import {useSpecialEffect} from 'shared-runtime';
import {AUTODEPS} from 'react';

/**
 * Note that a react compiler-based transform still has limitations on JS syntax.
 * We should surface these as actionable lint / build errors to devs.
 */
function Component({prop1}) {
  'use memo';
  useSpecialEffect(
    () => {
      try {
        console.log(prop1);
      } finally {
        console.log('exiting');
      }
    },
    [prop1],
    AUTODEPS
  );
  return <div>{prop1}</div>;
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics Todo: (BuildHIR::lowerStatement) Handle TryStatement without a catch clause (13:6).

error.todo-syntax.ts:11:2
   9 | function Component({prop1}) {
  10 |   'use memo';
> 11 |   useSpecialEffect(
     |   ^^^^^^^^^^^^^^^^^
> 12 |     () => {
     | ^^^^^^^^^^^
> 13 |       try {
     …
     | ^^^^^^^^^^^
> 20 |     AUTODEPS
     | ^^^^^^^^^^^
> 21 |   );
     | ^^^^ Cannot infer dependencies
  22 |   return <div>{prop1}</div>;
  23 | }
  24 |
```
          
      
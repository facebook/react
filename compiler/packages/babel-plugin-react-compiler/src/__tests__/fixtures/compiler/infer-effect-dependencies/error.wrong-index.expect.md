
## Input

```javascript
// @inferEffectDependencies
import {AUTODEPS} from 'react';
import useEffectWrapper from 'useEffectWrapper';

function Component({foo}) {
  useEffectWrapper(
    () => {
      console.log(foo);
    },
    [foo],
    AUTODEPS
  );
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.wrong-index.ts:6:2
   4 |
   5 | function Component({foo}) {
>  6 |   useEffectWrapper(
     |   ^^^^^^^^^^^^^^^^^
>    …
     | ^^^^^^^^^^^
> 12 |   );
     | ^^^^ Cannot infer dependencies
  13 | }
  14 |
```
          
      
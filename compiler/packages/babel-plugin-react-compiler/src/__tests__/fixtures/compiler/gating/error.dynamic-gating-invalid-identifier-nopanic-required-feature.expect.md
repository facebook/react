
## Input

```javascript
// @dynamicGating:{"source":"shared-runtime"} @panicThreshold:"none" @inferEffectDependencies
import {useEffect, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

function ReactiveVariable({propVal}) {
  'use memo if(invalid identifier)';
  const arr = [propVal];
  useEffect(() => print(arr), AUTODEPS);
}

export const FIXTURE_ENTRYPOINT = {
  fn: ReactiveVariable,
  params: [{}],
};

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.dynamic-gating-invalid-identifier-nopanic-required-feature.ts:8:2
   6 |   'use memo if(invalid identifier)';
   7 |   const arr = [propVal];
>  8 |   useEffect(() => print(arr), AUTODEPS);
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
   9 | }
  10 |
  11 | export const FIXTURE_ENTRYPOINT = {
```
          
      
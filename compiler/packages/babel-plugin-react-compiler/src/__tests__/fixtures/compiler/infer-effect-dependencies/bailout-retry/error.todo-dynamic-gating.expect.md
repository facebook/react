
## Input

```javascript
// @dynamicGating:{"source":"shared-runtime"} @inferEffectDependencies @panicThreshold:"none"

import useEffectWrapper from 'useEffectWrapper';
import {AUTODEPS} from 'react';

/**
 * TODO: run the non-forget enabled version through the effect inference
 * pipeline.
 */
function Component({foo}) {
  'use memo if(getTrue)';
  const arr = [];
  useEffectWrapper(() => arr.push(foo), AUTODEPS);
  arr.push(2);
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 1}],
  sequentialRenders: [{foo: 1}, {foo: 2}],
};

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.todo-dynamic-gating.ts:13:2
  11 |   'use memo if(getTrue)';
  12 |   const arr = [];
> 13 |   useEffectWrapper(() => arr.push(foo), AUTODEPS);
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  14 |   arr.push(2);
  15 |   return arr;
  16 | }
```
          
      
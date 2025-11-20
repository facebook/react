
## Input

```javascript
// @inferEffectDependencies @outputMode:"lint" @panicThreshold:"none"
import {print} from 'shared-runtime';
import useEffectWrapper from 'useEffectWrapper';
import {AUTODEPS} from 'react';

function Foo({propVal}) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr), AUTODEPS);

  const arr2 = [];
  useEffectWrapper(() => arr2.push(propVal), AUTODEPS);
  arr2.push(2);
  return {arr, arr2};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{propVal: 1}],
  sequentialRenders: [{propVal: 1}, {propVal: 2}],
};

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.infer-effect-deps-with-rule-violation--lint.ts:8:2
   6 | function Foo({propVal}) {
   7 |   const arr = [propVal];
>  8 |   useEffectWrapper(() => print(arr), AUTODEPS);
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
   9 |
  10 |   const arr2 = [];
  11 |   useEffectWrapper(() => arr2.push(propVal), AUTODEPS);
```
          
      
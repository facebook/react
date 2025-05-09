
## Input

```javascript
// @dynamicGating:{"source":"shared-runtime"} @inferEffectDependencies @panicThreshold:"none"

import useEffectWrapper from 'useEffectWrapper';

/**
 * TODO: run the non-forget enabled version through the effect inference
 * pipeline.
 */
function Component({foo}) {
  'use memo if(getTrue)';
  const arr = [];
  useEffectWrapper(() => arr.push(foo));
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
  10 |   'use memo if(getTrue)';
  11 |   const arr = [];
> 12 |   useEffectWrapper(() => arr.push(foo));
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (12:12)
  13 |   arr.push(2);
  14 |   return arr;
  15 | }
```
          
      

## Input

```javascript
// @gating @inferEffectDependencies @panicThreshold:"none"
import useEffectWrapper from 'useEffectWrapper';

/**
 * TODO: run the non-forget enabled version through the effect inference
 * pipeline.
 */
function Component({foo}) {
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
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.todo-gating.ts:10:2
   8 | function Component({foo}) {
   9 |   const arr = [];
> 10 |   useEffectWrapper(() => arr.push(foo));
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  11 |   arr.push(2);
  12 |   return arr;
  13 | }
```
          
      
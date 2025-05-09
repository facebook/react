
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
   8 | function Component({foo}) {
   9 |   const arr = [];
> 10 |   useEffectWrapper(() => arr.push(foo));
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (10:10)
  11 |   arr.push(2);
  12 |   return arr;
  13 | }
```
          
      
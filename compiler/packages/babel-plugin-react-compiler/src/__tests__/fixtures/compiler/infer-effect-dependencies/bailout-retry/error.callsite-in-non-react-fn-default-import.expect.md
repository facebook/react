
## Input

```javascript
// @inferEffectDependencies @compilationMode(infer) @panicThreshold(none)
import useMyEffect from 'useEffectWrapper';

function nonReactFn(arg) {
  useMyEffect(() => [1, 2, arg]);
}

```


## Error

```
  3 |
  4 | function nonReactFn(arg) {
> 5 |   useMyEffect(() => [1, 2, arg]);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] Untransformed reference to compiler-required feature. Either remove this call or ensure it is successfully transformed by the compiler (5:5)
  6 | }
  7 |
```
          
      
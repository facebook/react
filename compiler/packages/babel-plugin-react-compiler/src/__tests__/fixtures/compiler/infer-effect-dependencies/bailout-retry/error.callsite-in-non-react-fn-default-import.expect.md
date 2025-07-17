
## Input

```javascript
// @inferEffectDependencies @compilationMode:"infer" @panicThreshold:"none"
import useMyEffect from 'useEffectWrapper';

function nonReactFn(arg) {
  useMyEffect(() => [1, 2, arg]);
}

```


## Error

```
Found 1 error:
Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.callsite-in-non-react-fn-default-import.ts:5:2
  3 |
  4 | function nonReactFn(arg) {
> 5 |   useMyEffect(() => [1, 2, arg]);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  6 | }
  7 |
```
          
      

## Input

```javascript
// @flow @gating
component Foo(ref: React.RefSetter<Controls>) {
  return <Bar ref={ref}/>;
}
```


## Error

```
[ReactForget] Invariant: Encountered a function used before its declaration, which breaks Forget's gating codegen due to hoisting. Rewrite the reference to Foo_withRef to not rely on hoisting to fix this issue (2:2)
```
          
      
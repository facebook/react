
## Input

```javascript
// @flow @gating
component Foo(ref: React.RefSetter<Controls>) {
  return <Bar ref={ref}/>;
}
```


## Error

```
[ReactForget] Invariant: Encountered Foo_withRef used before declaration which breaks Forget's gating codegen due to hoisting. Rewrite the reference to not use hoisting to fix this issue (2:2)
```
          
      

## Input

```javascript
// @gating
const Foo = React.forwardRef(Foo_withRef);
function Foo_withRef(props, ref) {
  return <Bar ref={ref} {...props}></Bar>;
}

```


## Error

```
[ReactForget] Invariant: Encountered Foo_withRef used before declaration which breaks Forget's gating codegen due to hoisting. Rewrite the reference to not use hoisting to fix this issue (3:3)
```
          
      
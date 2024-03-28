
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
  1 | // @gating
  2 | const Foo = React.forwardRef(Foo_withRef);
> 3 | function Foo_withRef(props, ref) {
    |          ^^^^^^^^^^^ Invariant: Encountered a function used before its declaration, which breaks Forget's gating codegen due to hoisting. Rewrite the reference to Foo_withRef to not rely on hoisting to fix this issue (3:3)
  4 |   return <Bar ref={ref} {...props}></Bar>;
  5 | }
  6 |
```
          
      
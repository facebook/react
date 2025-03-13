
## Input

```javascript
// @flow @gating
component Foo(ref: React.RefSetter<Controls>) {
  return <Bar ref={ref} />;
}

```


## Error

```
  1 | // @flow @gating
> 2 | component Foo(ref: React.RefSetter<Controls>) {
    |           ^^^ Invariant: Encountered a function used before its declaration, which breaks Forget's gating codegen due to hoisting. Rewrite the reference to Foo_withRef to not rely on hoisting to fix this issue (2:2)
  3 |   return <Bar ref={ref} />;
  4 | }
  5 |
```
          
      
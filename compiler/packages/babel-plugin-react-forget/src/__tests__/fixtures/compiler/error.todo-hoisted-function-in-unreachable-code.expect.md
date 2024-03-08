
## Input

```javascript
function Component() {
  return <Foo />;

  // This is unreachable from a control-flow perspective, but it gets hoisted
  function Foo() {}
}

```


## Error

```
  1 | function Component() {
> 2 |   return <Foo />;
    |           ^^^ [ReactForget] Invariant: [hoisting] Expected value for identifier to be initialized. Foo$0 (2:2)
  3 |
  4 |   // This is unreachable from a control-flow perspective, but it gets hoisted
  5 |   function Foo() {}
```
          
      
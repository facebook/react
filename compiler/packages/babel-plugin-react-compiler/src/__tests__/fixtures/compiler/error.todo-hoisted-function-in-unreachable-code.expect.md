
## Input

```javascript
// @compilationMode(infer)
function Component() {
  return <Foo />;

  // This is unreachable from a control-flow perspective, but it gets hoisted
  function Foo() {}
}

```


## Error

```
  4 |
  5 |   // This is unreachable from a control-flow perspective, but it gets hoisted
> 6 |   function Foo() {}
    |   ^^^^^^^^^^^^^^^^^ Todo: Support functions with unreachable code that may contain hoisted declarations (6:6)
  7 | }
  8 |
```
          
      
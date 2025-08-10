
## Input

```javascript
// @compilationMode:"infer"
function Component() {
  return <Foo />;

  // This is unreachable from a control-flow perspective, but it gets hoisted
  function Foo() {}
}

```


## Error

```
Found 1 error:

Todo: Support functions with unreachable code that may contain hoisted declarations

error.todo-hoisted-function-in-unreachable-code.ts:6:2
  4 |
  5 |   // This is unreachable from a control-flow perspective, but it gets hoisted
> 6 |   function Foo() {}
    |   ^^^^^^^^^^^^^^^^^ Support functions with unreachable code that may contain hoisted declarations
  7 | }
  8 |
```
          
      
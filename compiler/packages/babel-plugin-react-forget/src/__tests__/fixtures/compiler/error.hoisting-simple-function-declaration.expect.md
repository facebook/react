
## Input

```javascript
function hoisting() {
  function bar() {
    return x;
  }
  return baz(); // OK: FuncDecls are HoistableDeclarations that have both declaration and value hoisting
  function baz() {
    return bar();
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```


## Error

```
[ReactForget] Todo: Unsupported declaration type for hoisting. variable "baz" declared with FunctionDeclaration (5:5)
```
          
      
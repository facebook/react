
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
  3 |     return x;
  4 |   }
> 5 |   return baz(); // OK: FuncDecls are HoistableDeclarations that have both declaration and value hoisting
    |          ^^^^^ Todo: Unsupported declaration type for hoisting. variable "baz" declared with FunctionDeclaration (5:5)
  6 |   function baz() {
  7 |     return bar();
  8 |   }
```
          
      

## Input

```javascript
function component(a) {
  let t = {a};
  x(t); // hoisted call
  function x(p) {
    p.foo();
  }
  return t;
}

```


## Error

```
  1 | function component(a) {
  2 |   let t = {a};
> 3 |   x(t); // hoisted call
    |   ^^^^ Todo: Unsupported declaration type for hoisting. variable "x" declared with FunctionDeclaration (3:3)
  4 |   function x(p) {
  5 |     p.foo();
  6 |   }
```
          
      
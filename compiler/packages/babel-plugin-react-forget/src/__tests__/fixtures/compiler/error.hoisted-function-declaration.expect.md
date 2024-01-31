
## Input

```javascript
function component(a) {
  let t = { a };
  x(t); // hoisted call
  function x(p) {
    p.foo();
  }
  return t;
}

```


## Error

```
[ReactForget] Todo: Unsupported declaration type for hoisting. variable "x" declared with FunctionDeclaration (3:3)
```
          
      
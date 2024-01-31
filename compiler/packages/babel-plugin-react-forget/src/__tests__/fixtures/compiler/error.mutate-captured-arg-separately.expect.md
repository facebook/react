
## Input

```javascript
// Let's not support identifiers defined after use for now.
function component(a) {
  let y = function () {
    m(x);
  };

  let x = { a };
  m(x);
  return y;
}

```


## Error

```
[ReactForget] Todo: Handle non-const declarations for hoisting. variable "x" declared with let (4:4)
```
          
      
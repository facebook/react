
## Input

```javascript
// Let's not support identifiers defined after use for now.
function component(a) {
  let y = function () {
    m(x);
  };

  let x = {a};
  m(x);
  return y;
}

```


## Error

```
  2 | function component(a) {
  3 |   let y = function () {
> 4 |     m(x);
    |     ^^^^ Todo: Handle non-const declarations for hoisting. variable "x" declared with let (4:4)
  5 |   };
  6 |
  7 |   let x = {a};
```
          
      
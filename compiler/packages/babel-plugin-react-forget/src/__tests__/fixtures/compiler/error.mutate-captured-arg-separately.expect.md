
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
[ReactForget] Todo: [hoisting] EnterSSA: Expected identifier to be defined before being used. Identifier x$1 is undefined (7:7)
```
          
      
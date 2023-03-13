
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
[ReactForget] Invariant: identifier x$2 should have been defined before use (7:7)
```
          
      
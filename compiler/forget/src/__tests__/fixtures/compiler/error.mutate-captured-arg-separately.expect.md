
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
[ReactForget] Invariant: EnterSSA: Expected identifier to be defined before being used. Identifier x$2 is undfined (7:7)
```
          
      
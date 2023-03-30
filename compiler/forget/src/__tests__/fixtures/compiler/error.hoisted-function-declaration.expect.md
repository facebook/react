
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
[ReactForget] Invariant: identifier x$6 should have been defined before use (4:4)
```
          
      
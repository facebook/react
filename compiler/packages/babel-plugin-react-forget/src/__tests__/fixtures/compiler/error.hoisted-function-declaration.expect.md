
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
[ReactForget] Todo: [hoisting] EnterSSA: Expected identifier to be defined before being used. Identifier x$5 is undefined
```
          
      
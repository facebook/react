
## Input

```javascript
function Component(props) {
  let x = makeObject();
  x.foo(([[x]] = makeObject()));
  return x;
}

```


## Error

```
  2 |   let x = makeObject();
  3 |   x.foo(([[x]] = makeObject()));
> 4 |   return x;
    |          ^ Invariant: [hoisting] Expected value for identifier to be initialized. x$26 (4:4)
  5 | }
  6 |
```
          
      
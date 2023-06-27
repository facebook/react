
## Input

```javascript
function component(a, b) {
  let y = { b };
  let z = { a };
  let x = function () {
    z.a = 2;
    y.b;
  };
  let t = <Foo x={x}></Foo>;
  mutate(x); // x should be frozen here
  return t;
}

```


## Error

```
[ReactForget] InvalidReact: Cannot use a mutable function where an immutable value is expected (8:8)
```
          
      
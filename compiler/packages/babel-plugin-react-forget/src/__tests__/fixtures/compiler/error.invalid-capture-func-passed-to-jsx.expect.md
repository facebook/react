
## Input

```javascript
// @validateFrozenLambdas
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
[ReactForget] InvalidReact: This mutates a variable that is managed by React, where an immutable value or a function was expected (9:9)
```
          
      
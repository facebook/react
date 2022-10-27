
## Input

```javascript
function foo() {
  const x = [];
  const y = { x: x };
  y.x.push([]);
  return y;
}

```

## HIR

```
bb0:
  Const mutate x$4 = Array []
  Const mutate y$5 = Object { x: read x$4 }
  Const mutate $6 = Array []
  Call mutate y$5.x.push(mutate $6)
  Return freeze y$5
```

## Code

```javascript
function foo$0() {
  const x$4 = [];
  const y$5 = {
    x: x$4,
  };
  y$5.x.push([]);
  return y$5;
}

```
      
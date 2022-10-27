
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  return y;
}

```

## HIR

```
bb0:
  Const mutate x$3 = Array []
  Const mutate y$4 = Object {  }
  Reassign mutate y$5.x = read x$3
  Return freeze y$5
```

## Code

```javascript
function foo$0() {
  const x$3 = [];
  const y$4 = {};
  y$5 = x$3;
  return y$5;
}

```
      
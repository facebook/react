
## Input

```javascript
function foo(props) {
  let y = 0;
  for (
    let x = 0;
    x > props.min && x < props.max;
    x += props.cond ? props.increment : 2
  ) {
    x *= 2;
    y += x;
  }
  return y;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.useMemoCache();
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y = 0;
    $[0] = y;
  } else {
    y = $[0];
  }
  for (
    let x = 0;
    x > props.min && x < props.max;
    x = x$0 + (props.cond ? props.increment : (2, 2)), x
  ) {
    const x$0 = x * 2;
    const y$1 = y + x$0;
  }
  return y;
}

```
      
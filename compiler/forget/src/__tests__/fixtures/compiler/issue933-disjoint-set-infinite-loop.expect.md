
## Input

```javascript
// This caused an infinite loop in the compiler
function MyApp(props) {
  const y = makeObj();
  const tmp = y.a;
  const tmp2 = tmp.b;
  y.push(tmp2);
  return y;
}

```

## Code

```javascript
// This caused an infinite loop in the compiler
function MyApp(props) {
  const $ = React.unstable_useMemoCache(1);
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y = makeObj();
    const tmp = y.a;
    const tmp2 = tmp.b;
    y.push(tmp2);
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      
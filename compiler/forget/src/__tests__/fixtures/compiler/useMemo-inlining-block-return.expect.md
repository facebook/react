
## Input

```javascript
// @inlineUseMemo
function component(a, b) {
  let x = useMemo(() => {
    if (a) {
      return { b };
    }
  }, [a, b]);
  return x;
}

```

## Code

```javascript
// @inlineUseMemo
function component(a, b) {
  const $ = React.unstable_useMemoCache(3);
  if (a) {
    const c_0 = $[0] !== b;
    let t0;
    if (c_0) {
      t0 = { b };
      $[0] = b;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = t0;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
  }
  const x = t1;
  return x;
}

```
      
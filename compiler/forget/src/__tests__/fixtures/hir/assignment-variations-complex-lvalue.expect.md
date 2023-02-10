
## Input

```javascript
function g() {
  const x = { y: { z: 1 } };
  x.y.z = x.y.z + 1;
  x.y.z *= 2;
  return x;
}

```

## Code

```javascript
function g() {
  const $ = React.unstable_useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = { y: { z: 1 } };
    x.y.z = x.y.z + 1;
    const t0 = x.y;
    t0.z = t0.z * 2;
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      
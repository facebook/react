
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
  const $ = React.useMemoCache();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      z: 1,
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }

  const c_1 = $[1] !== t0;
  let x;

  if (c_1) {
    x = {
      y: t0,
    };
    x.z.y = x.y.z + 1;
    x.z.y = x.y.z * 2;
    $[1] = t0;
    $[2] = x;
  } else {
    x = $[2];
  }

  return x;
}

```
      
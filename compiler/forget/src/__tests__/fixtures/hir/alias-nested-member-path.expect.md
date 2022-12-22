
## Input

```javascript
function component() {
  let z = [];
  let y = {};
  y.z = z;
  let x = {};
  x.y = y;
  return x;
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let z;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    z = [];
    $[0] = z;
  } else {
    z = $[0];
  }

  const c_1 = $[1] !== z;
  let y;

  if (c_1) {
    y = {};
    y.z = z;
    $[1] = z;
    $[2] = y;
  } else {
    y = $[2];
  }

  const c_3 = $[3] !== y;
  let x;

  if (c_3) {
    x = {};
    x.y = y;
    $[3] = y;
    $[4] = x;
  } else {
    x = $[4];
  }

  return x;
}

```
      

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
  const $ = React.unstable_useMemoCache();
  let z;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    z = [];
    $[0] = z;
  } else {
    z = $[0];
  }
  let y;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y = {};
    y.z = z;
    $[1] = y;
  } else {
    y = $[1];
  }
  let x;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    x.y = y;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      

## Input

```javascript
function component() {
  let x = foo();
  let y = foo();
  if (x > y) {
    let z = {};
  }

  let z = foo();
  return z;
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = foo();
    $[0] = x;
  } else {
    x = $[0];
  }
  let y;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y = foo();
    $[1] = y;
  } else {
    y = $[1];
  }
  if (x > y) {
  }
  let z_0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    z_0 = foo();
    $[2] = z_0;
  } else {
    z_0 = $[2];
  }
  return z_0;
}

```
      
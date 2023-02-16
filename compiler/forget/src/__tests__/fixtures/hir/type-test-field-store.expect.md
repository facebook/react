
## Input

```javascript
function component() {
  let x = {};
  let q = {};
  x.t = q;
  let z = x.t;
  return z;
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache(2);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    let q;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      q = {};
      $[1] = q;
    } else {
      q = $[1];
    }
    x.t = q;
    $[0] = x;
  } else {
    x = $[0];
  }

  const z = x.t;
  return z;
}

```
      
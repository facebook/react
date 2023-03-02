
## Input

```javascript
function component() {
  let a = some();
  let b = someOther();
  if (a > b) {
    let m = {};
  }
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = some();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const a = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = someOther();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const b = t1;
  if (a > b) {
  }
}

```
      
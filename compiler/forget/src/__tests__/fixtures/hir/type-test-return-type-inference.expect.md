
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
  const $ = React.unstable_useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = foo();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = foo();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const y = t1;
  if (x > y) {
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = foo();
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const z_0 = t2;
  return z_0;
}

```
      
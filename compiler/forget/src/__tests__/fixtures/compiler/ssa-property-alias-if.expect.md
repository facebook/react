
## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
  } else {
    let z = {};
    x.z = z;
  }
  return x;
}

```

## Code

```javascript
function foo(a) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = {};
    if (a) {
      let t0;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {};
        $[2] = t0;
      } else {
        t0 = $[2];
      }
      const y = t0;
      x.y = y;
    } else {
      let t1;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = {};
        $[3] = t1;
      } else {
        t1 = $[3];
      }
      const z = t1;
      x.z = z;
    }
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      

## Input

```javascript
function component() {
  let p = makePrimitive();
  p + p; // infer p as primitive
  let o = {};

  let x = {};

  x.t = p; // infer x.t as primitive
  let z = x.t;

  x.t = o; // generalize x.t
  let y = x.t;
  return y;
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makePrimitive();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const p = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {};
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const o = t1;
  let x;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};

    x.t = p;

    x.t = o;
    $[2] = x;
  } else {
    x = $[2];
  }
  const y = x.t;
  return y;
}

```
      
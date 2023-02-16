
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
  let p;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    p = makePrimitive();
    $[0] = p;
  } else {
    p = $[0];
  }
  let o;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    o = {};
    $[1] = o;
  } else {
    o = $[1];
  }
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
      
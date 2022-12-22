
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
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let p;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    p = makePrimitive();
    $[0] = p;
  } else {
    p = $[0];
  }

  p + p;
  let o;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    o = {};
    $[1] = o;
  } else {
    o = $[1];
  }

  const c_2 = $[2] !== p;
  const c_3 = $[3] !== o;
  let x;

  if (c_2 || c_3) {
    x = {};
    x.t = p;
    const z = x.t;
    x.t = o;
    $[2] = p;
    $[3] = o;
    $[4] = x;
  } else {
    x = $[4];
  }

  const y = x.t;
}

```
      
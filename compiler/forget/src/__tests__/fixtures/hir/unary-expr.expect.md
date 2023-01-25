
## Input

```javascript
function component(a) {
  let t = { t: a };
  let z = +t.t;
  let q = -t.t;
  let p = void t.t;
  let n = delete t.t;
  let m = !t.t;
  let e = ~t.t;
  let f = typeof t.t;
  return { z, p, q, n, m, e, f };
}

```

## Code

```javascript
function component(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let t;
  if (c_0) {
    t = { t: a };
    $[0] = a;
    $[1] = t;
  } else {
    t = $[1];
  }
  const z = +t.t;
  const q = -t.t;
  const p = void t.t;
  const n = delete t.t;
  const m = !t.t;
  const e = ~t.t;
  const f = typeof t.t;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = { z: z, p: p, q: q, n: n, m: m, e: e, f: f };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

```
      
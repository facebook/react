
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
  const $ = React.unstable_useMemoCache(8);
  const t = { t: a };
  const z = +t.t;
  const q = -t.t;
  const p = void t.t;
  const n = delete t.t;
  const m = !t.t;
  const e = ~t.t;
  const f = typeof t.t;
  const c_0 = $[0] !== z;
  const c_1 = $[1] !== p;
  const c_2 = $[2] !== q;
  const c_3 = $[3] !== n;
  const c_4 = $[4] !== m;
  const c_5 = $[5] !== e;
  const c_6 = $[6] !== f;
  let t0;
  if (c_0 || c_1 || c_2 || c_3 || c_4 || c_5 || c_6) {
    t0 = { z, p, q, n, m, e, f };
    $[0] = z;
    $[1] = p;
    $[2] = q;
    $[3] = n;
    $[4] = m;
    $[5] = e;
    $[6] = f;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      
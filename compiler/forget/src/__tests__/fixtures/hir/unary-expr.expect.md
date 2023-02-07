
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
  const $ = React.unstable_useMemoCache();
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
  const c_2 = $[2] !== z;
  const c_3 = $[3] !== p;
  const c_4 = $[4] !== q;
  const c_5 = $[5] !== n;
  const c_6 = $[6] !== m;
  const c_7 = $[7] !== e;
  const c_8 = $[8] !== f;
  let t0;
  if (c_2 || c_3 || c_4 || c_5 || c_6 || c_7 || c_8) {
    t0 = { z: z, p: p, q: q, n: n, m: m, e: e, f: f };
    $[2] = z;
    $[3] = p;
    $[4] = q;
    $[5] = n;
    $[6] = m;
    $[7] = e;
    $[8] = f;
    $[9] = t0;
  } else {
    t0 = $[9];
  }
  return t0;
}

```
      

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
  const $ = React.unstable_useMemoCache(14);
  const c_0 = $[0] !== a;
  let t0;
  let t;
  let z;
  let p;
  let q;
  if (c_0) {
    t = { t: a };
    z = +t.t;
    q = -t.t;
    p = void t.t;
    t0 = delete t.t;
    $[0] = a;
    $[1] = t0;
    $[2] = t;
    $[3] = z;
    $[4] = p;
    $[5] = q;
  } else {
    t0 = $[1];
    t = $[2];
    z = $[3];
    p = $[4];
    q = $[5];
  }
  const n = t0;
  const m = !t.t;
  const e = ~t.t;
  const f = typeof t.t;
  const c_6 = $[6] !== z;
  const c_7 = $[7] !== p;
  const c_8 = $[8] !== q;
  const c_9 = $[9] !== n;
  const c_10 = $[10] !== m;
  const c_11 = $[11] !== e;
  const c_12 = $[12] !== f;
  let t1;
  if (c_6 || c_7 || c_8 || c_9 || c_10 || c_11 || c_12) {
    t1 = { z, p, q, n, m, e, f };
    $[6] = z;
    $[7] = p;
    $[8] = q;
    $[9] = n;
    $[10] = m;
    $[11] = e;
    $[12] = f;
    $[13] = t1;
  } else {
    t1 = $[13];
  }
  return t1;
}

```
      
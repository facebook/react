
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
  const c_2 = $[2] !== t.t;
  let z;
  if (c_2) {
    z = +t.t;
    $[2] = t.t;
    $[3] = z;
  } else {
    z = $[3];
  }
  const c_4 = $[4] !== t.t;
  let q;
  if (c_4) {
    q = -t.t;
    $[4] = t.t;
    $[5] = q;
  } else {
    q = $[5];
  }
  const c_6 = $[6] !== t.t;
  let p;
  if (c_6) {
    p = void t.t;
    $[6] = t.t;
    $[7] = p;
  } else {
    p = $[7];
  }
  const c_8 = $[8] !== t.t;
  let n;
  if (c_8) {
    n = delete t.t;
    $[8] = t.t;
    $[9] = n;
  } else {
    n = $[9];
  }
  const c_10 = $[10] !== t.t;
  let m;
  if (c_10) {
    m = !t.t;
    $[10] = t.t;
    $[11] = m;
  } else {
    m = $[11];
  }
  const c_12 = $[12] !== t.t;
  let e;
  if (c_12) {
    e = ~t.t;
    $[12] = t.t;
    $[13] = e;
  } else {
    e = $[13];
  }
  const c_14 = $[14] !== t.t;
  let f;
  if (c_14) {
    f = typeof t.t;
    $[14] = t.t;
    $[15] = f;
  } else {
    f = $[15];
  }
  const c_16 = $[16] !== z;
  const c_17 = $[17] !== p;
  const c_18 = $[18] !== q;
  const c_19 = $[19] !== n;
  const c_20 = $[20] !== m;
  const c_21 = $[21] !== e;
  const c_22 = $[22] !== f;
  let t23;
  if (c_16 || c_17 || c_18 || c_19 || c_20 || c_21 || c_22) {
    t23 = { z: z, p: p, q: q, n: n, m: m, e: e, f: f };
    $[16] = z;
    $[17] = p;
    $[18] = q;
    $[19] = n;
    $[20] = m;
    $[21] = e;
    $[22] = f;
    $[23] = t23;
  } else {
    t23 = $[23];
  }
  return t23;
}

```
      
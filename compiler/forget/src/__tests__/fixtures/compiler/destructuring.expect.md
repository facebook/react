
## Input

```javascript
function foo(a, b, c) {
  const [
    d,
    [
      {
        e: { f },
        ...g
      },
    ],
    ...h
  ] = a;
  const {
    l: {
      m: [[n], ...o],
    },
    p,
  } = b;
  return [d, f, g, h, n, o, p];
}

```

## Code

```javascript
import * as React from "react";
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(18);
  const c_0 = $[0] !== a;
  let t0;
  let d;
  let h;
  if (c_0) {
    [d, t0, ...h] = a;
    $[0] = a;
    $[1] = t0;
    $[2] = d;
    $[3] = h;
  } else {
    t0 = $[1];
    d = $[2];
    h = $[3];
  }
  const [t1] = t0;
  const c_4 = $[4] !== t1;
  let t2;
  let g;
  if (c_4) {
    ({ e: t2, ...g } = t1);
    $[4] = t1;
    $[5] = t2;
    $[6] = g;
  } else {
    t2 = $[5];
    g = $[6];
  }
  const { f } = t2;
  const { l: t52, p } = b;
  const { m: t3 } = t52;
  const c_7 = $[7] !== t3;
  let t4;
  let o;
  if (c_7) {
    [t4, ...o] = t3;
    $[7] = t3;
    $[8] = t4;
    $[9] = o;
  } else {
    t4 = $[8];
    o = $[9];
  }
  const [n] = t4;
  const c_10 = $[10] !== d;
  const c_11 = $[11] !== f;
  const c_12 = $[12] !== g;
  const c_13 = $[13] !== h;
  const c_14 = $[14] !== n;
  const c_15 = $[15] !== o;
  const c_16 = $[16] !== p;
  let t5;
  if (c_10 || c_11 || c_12 || c_13 || c_14 || c_15 || c_16) {
    t5 = [d, f, g, h, n, o, p];
    $[10] = d;
    $[11] = f;
    $[12] = g;
    $[13] = h;
    $[14] = n;
    $[15] = o;
    $[16] = p;
    $[17] = t5;
  } else {
    t5 = $[17];
  }
  return t5;
}

```
      

## Input

```javascript
function foo(a, b, c) {
  const [
    d,
    [
      {
        e: {f},
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

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a, b, c) {
  const $ = _c(18);
  let t0;
  let d;
  let h;
  if ($[0] !== a) {
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
  let t2;
  let g;
  if ($[4] !== t1) {
    ({ e: t2, ...g } = t1);
    $[4] = t1;
    $[5] = t2;
    $[6] = g;
  } else {
    t2 = $[5];
    g = $[6];
  }
  const { f } = t2;
  const { l: t3, p } = b;
  const { m: t4 } = t3;
  let t5;
  let o;
  if ($[7] !== t4) {
    [t5, ...o] = t4;
    $[7] = t4;
    $[8] = t5;
    $[9] = o;
  } else {
    t5 = $[8];
    o = $[9];
  }
  const [n] = t5;
  let t6;
  if (
    $[10] !== d ||
    $[11] !== f ||
    $[12] !== g ||
    $[13] !== h ||
    $[14] !== n ||
    $[15] !== o ||
    $[16] !== p
  ) {
    t6 = [d, f, g, h, n, o, p];
    $[10] = d;
    $[11] = f;
    $[12] = g;
    $[13] = h;
    $[14] = n;
    $[15] = o;
    $[16] = p;
    $[17] = t6;
  } else {
    t6 = $[17];
  }
  return t6;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
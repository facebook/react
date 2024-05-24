
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

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a) {
  const $ = _c(14);
  let t0;
  let t;
  let t1;
  let t2;
  let t3;
  if ($[0] !== a) {
    t = { t: a };
    const z = +t.t;

    t1 = z;
    const p = void t.t;
    t2 = p;
    const q = -t.t;
    t3 = q;
    t0 = delete t.t;
    $[0] = a;
    $[1] = t0;
    $[2] = t;
    $[3] = t1;
    $[4] = t2;
    $[5] = t3;
  } else {
    t0 = $[1];
    t = $[2];
    t1 = $[3];
    t2 = $[4];
    t3 = $[5];
  }
  const n = t0;
  const m = !t.t;
  const e = ~t.t;
  const f = typeof t.t;
  let t4;
  if (
    $[6] !== t1 ||
    $[7] !== t2 ||
    $[8] !== t3 ||
    $[9] !== n ||
    $[10] !== m ||
    $[11] !== e ||
    $[12] !== f
  ) {
    t4 = { z: t1, p: t2, q: t3, n, m, e, f };
    $[6] = t1;
    $[7] = t2;
    $[8] = t3;
    $[9] = n;
    $[10] = m;
    $[11] = e;
    $[12] = f;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
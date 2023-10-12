
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
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(8);
  const t = { t: a };
  const z = +t.t;
  const q = -t.t;
  const p = void t.t;
  const n = delete t.t;
  const m = !t.t;
  const e = ~t.t;
  const f = typeof t.t;
  let t0;
  if (
    $[0] !== z ||
    $[1] !== p ||
    $[2] !== q ||
    $[3] !== n ||
    $[4] !== m ||
    $[5] !== e ||
    $[6] !== f
  ) {
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

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
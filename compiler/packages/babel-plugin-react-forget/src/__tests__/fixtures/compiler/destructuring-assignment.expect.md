
## Input

```javascript
function foo(a, b, c) {
  let d, g, n, o;
  [
    d,
    [
      {
        e: { f: g },
      },
    ],
  ] = a;
  ({
    l: {
      m: [[n]],
    },
    o,
  } = b);
  return { d, g, n, o };
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b, c) {
  const $ = useMemoCache(5);
  let d;
  let g;
  let n;
  let o;
  const [t49, t50] = a;
  d = t49;
  const [t54] = t50;
  const { e: t56 } = t54;
  ({ f: g } = t56);
  const { l: t61, o: t62 } = b;
  const { m: t64 } = t61;
  const [t66] = t64;
  [n] = t66;
  o = t62;
  let t0;
  if ($[0] !== d || $[1] !== g || $[2] !== n || $[3] !== o) {
    t0 = { d, g, n, o };
    $[0] = d;
    $[1] = g;
    $[2] = n;
    $[3] = o;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
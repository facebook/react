
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

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b, c) {
  const $ = useMemoCache(5);

  const [d, t47] = a;
  const [t49] = t47;
  const { e: t51 } = t49;
  const { f: g } = t51;
  const { l: t56, o } = b;
  const { m: t59 } = t56;
  const [t61] = t59;
  const [n] = t61;
  const c_0 = $[0] !== d;
  const c_1 = $[1] !== g;
  const c_2 = $[2] !== n;
  const c_3 = $[3] !== o;
  let t0;
  if (c_0 || c_1 || c_2 || c_3) {
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

```
      
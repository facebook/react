
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
  return { e, g, n, o };
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache();

  const g = a[1][0].e.f;

  const n = b.l.m[0][0];
  const o = b.o;
  const c_0 = $[0] !== g;
  const c_1 = $[1] !== n;
  const c_2 = $[2] !== o;
  let t0;
  if (c_0 || c_1 || c_2) {
    t0 = { e: e, g: g, n: n, o: o };
    $[0] = g;
    $[1] = n;
    $[2] = o;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

```
      
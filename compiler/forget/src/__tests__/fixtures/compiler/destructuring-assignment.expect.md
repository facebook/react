
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
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(5);

  const [d, t46] = a;
  const [t48] = t46;
  const { e: t50 } = t48;
  const { f: g } = t50;
  const { l: t55, o } = b;
  const { m: t58 } = t55;
  const [t60] = t58;
  const [n] = t60;
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
      

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
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(8);
  const [d, t40, ...h] = a;

  const [t43] = t40;
  const { e: t45, ...g } = t43;
  const { f } = t45;

  const { l: t51, p } = b;
  const { m: t54 } = t51;
  const [t56, ...o] = t54;
  const [n] = t56;
  const c_0 = $[0] !== d;
  const c_1 = $[1] !== f;
  const c_2 = $[2] !== g;
  const c_3 = $[3] !== h;
  const c_4 = $[4] !== n;
  const c_5 = $[5] !== o;
  const c_6 = $[6] !== p;
  let t0;
  if (c_0 || c_1 || c_2 || c_3 || c_4 || c_5 || c_6) {
    t0 = [d, f, g, h, n, o, p];
    $[0] = d;
    $[1] = f;
    $[2] = g;
    $[3] = h;
    $[4] = n;
    $[5] = o;
    $[6] = p;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      
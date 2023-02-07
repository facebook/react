
## Input

```javascript
function foo(a, b, c) {
  const [
    d,
    [
      {
        e: { f },
      },
    ],
  ] = a;
  const {
    l: {
      m: [[n]],
    },
    o,
  } = b;
  return [d, f, n, o];
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache();
  const d = a[0];
  const f = a[1][0].e.f;

  const n = b.l.m[0][0];
  const o = b.o;
  const c_0 = $[0] !== d;
  const c_1 = $[1] !== f;
  const c_2 = $[2] !== n;
  const c_3 = $[3] !== o;
  let t0;
  if (c_0 || c_1 || c_2 || c_3) {
    t0 = [d, f, n, o];
    $[0] = d;
    $[1] = f;
    $[2] = n;
    $[3] = o;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

```
      

## Input

```javascript
function component({ a, b }) {
  let y = { a };
  let z = { b };
  return { y, z };
}

```

## Code

```javascript
function component(t8) {
  const $ = React.useMemoCache();
  const a = t8.a;
  const b = t8.b;
  const c_0 = $[0] !== a;
  let y;
  if (c_0) {
    y = { a: a };
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  const c_2 = $[2] !== b;
  let z;
  if (c_2) {
    z = { b: b };
    $[2] = b;
    $[3] = z;
  } else {
    z = $[3];
  }
  const c_4 = $[4] !== y;
  const c_5 = $[5] !== z;
  let t0;
  if (c_4 || c_5) {
    t0 = { y: y, z: z };
    $[4] = y;
    $[5] = z;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  return t0;
}

```
      
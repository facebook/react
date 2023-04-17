
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
function component(t17) {
  const $ = React.unstable_useMemoCache(7);
  const { a, b } = t17;
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  const c_2 = $[2] !== b;
  let t1;
  if (c_2) {
    t1 = { b };
    $[2] = b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const z = t1;
  const c_4 = $[4] !== y;
  const c_5 = $[5] !== z;
  let t2;
  if (c_4 || c_5) {
    t2 = { y, z };
    $[4] = y;
    $[5] = z;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      
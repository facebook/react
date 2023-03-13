
## Input

```javascript
function foo(a, b, c) {
  // Construct and freeze x, y
  const x = makeObject(a);
  const y = makeObject(a);
  <div>
    {x}
    {y}
  </div>;

  // z should depend on `x`, `y.method`, and `b`
  const z = x[y.method](b);
  return z;
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(8);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = makeObject(a);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const c_2 = $[2] !== a;
  let t1;
  if (c_2) {
    t1 = makeObject(a);
    $[2] = a;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const y = t1;
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== y.method;
  const c_6 = $[6] !== b;
  let t2;
  if (c_4 || c_5 || c_6) {
    t2 = x[y.method](b);
    $[4] = x;
    $[5] = y.method;
    $[6] = b;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const z = t2;
  return z;
}

```
      
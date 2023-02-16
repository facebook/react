
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
  let x;
  if (c_0) {
    x = makeObject(a);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== a;
  let y;
  if (c_2) {
    y = makeObject(a);
    $[2] = a;
    $[3] = y;
  } else {
    y = $[3];
  }
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== y.method;
  const c_6 = $[6] !== b;
  let z;
  if (c_4 || c_5 || c_6) {
    z = x[y.method](b);
    $[4] = x;
    $[5] = y.method;
    $[6] = b;
    $[7] = z;
  } else {
    z = $[7];
  }
  return z;
}

```
      

## Input

```javascript
function foo(a, b, c) {
  // Construct and freeze x
  const x = makeObject(a);
  <div>{x}</div>;

  // y should depend on `x` and `b`
  const method = x.method;
  const y = method.call(x, b);
  return y;
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = makeObject(a);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  const method = x.method;
  const c_2 = $[2] !== method;
  const c_3 = $[3] !== x;
  const c_4 = $[4] !== b;
  let y;
  if (c_2 || c_3 || c_4) {
    y = method.call(x, b);
    $[2] = method;
    $[3] = x;
    $[4] = b;
    $[5] = y;
  } else {
    y = $[5];
  }
  return y;
}

```
      
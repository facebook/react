
## Input

```javascript
function foo(a, b, c) {
  // Construct and freeze x
  const x = makeObject(a);
  <div>{x}</div>;

  // y should depend on `x` and `b`
  const y = x.foo(b);
  return y;
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = makeObject(a);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== b;
  let y;
  if (c_2 || c_3) {
    y = x.foo(b);
    $[2] = x;
    $[3] = b;
    $[4] = y;
  } else {
    y = $[4];
  }
  return y;
}

```
      

## Input

```javascript
function component(a, b) {
  let y = { b };
  let z = { a };
  let x = function () {
    z.a = 2;
    y.b;
  };
  return x;
}

```

## Code

```javascript
function component(a, b) {
  const $ = React.unstable_useMemoCache(7);
  const c_0 = $[0] !== b;
  let y;
  if (c_0) {
    y = { b: b };
    $[0] = b;
    $[1] = y;
  } else {
    y = $[1];
  }
  const c_2 = $[2] !== a;
  let z;
  if (c_2) {
    z = { a: a };
    $[2] = a;
    $[3] = z;
  } else {
    z = $[3];
  }
  const c_4 = $[4] !== z.a;
  const c_5 = $[5] !== y.b;
  let x;
  if (c_4 || c_5) {
    x = function () {
      z.a = 2;
      y.b;
    };
    $[4] = z.a;
    $[5] = y.b;
    $[6] = x;
  } else {
    x = $[6];
  }
  return x;
}

```
      
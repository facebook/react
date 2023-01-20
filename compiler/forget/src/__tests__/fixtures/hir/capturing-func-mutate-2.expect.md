
## Input

```javascript
function component(a, b) {
  let y = { b };
  let z = { a };
  let x = function () {
    z.a = 2;
    y.b;
  };
  x();
  return x;
}

```

## Code

```javascript
function component(a, b) {
  const $ = React.useMemoCache();
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
  const c_3 = $[3] !== y.b;
  let x;
  if (c_2 || c_3) {
    const z = { a: a };
    x = function () {
      z.a = 2;
      y.b;
    };
    x();
    $[2] = a;
    $[3] = y.b;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

```
      
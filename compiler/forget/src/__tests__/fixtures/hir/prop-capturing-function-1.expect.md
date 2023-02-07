
## Input

```javascript
function component(a, b) {
  let z = { a, b };
  let x = function () {
    z;
  };
  return x;
}

```

## Code

```javascript
function component(a, b) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  let z;
  if (c_0 || c_1) {
    z = { a: a, b: b };
    $[0] = a;
    $[1] = b;
    $[2] = z;
  } else {
    z = $[2];
  }
  const c_3 = $[3] !== z;
  let x;
  if (c_3) {
    x = function () {
      z;
    };
    $[3] = z;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

```
      
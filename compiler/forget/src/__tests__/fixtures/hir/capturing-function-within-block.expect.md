
## Input

```javascript
function component(a) {
  let z = { a };
  let x;
  {
    x = function () {
      z;
    };
  }
  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== a;
  let z;
  if (c_0) {
    z = { a: a };
    $[0] = a;
    $[1] = z;
  } else {
    z = $[1];
  }
  const c_2 = $[2] !== z;
  let x;
  if (c_2) {
    x = function () {
      z;
    };
    $[2] = z;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      
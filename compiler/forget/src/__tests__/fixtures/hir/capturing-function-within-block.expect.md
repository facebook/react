
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
  let t0;
  if (c_2) {
    t0 = function () {
      z;
    };
    $[2] = z;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const x = t0;
  return x;
}

```
      
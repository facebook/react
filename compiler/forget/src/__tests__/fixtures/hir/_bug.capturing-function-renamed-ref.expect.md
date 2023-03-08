
## Input

```javascript
function component(a, b) {
  let z = { a };
  {
    let z = { b };
    (function () {
      mutate(z);
    })();
  }
  return z;
}

```

## Code

```javascript
function component(a, b) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  const c_2 = $[2] !== b;
  let t1;
  if (c_2) {
    t1 = { b };
    $[2] = b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const z_0 = t1;
  (function () {
    mutate(z);
  })();
  return z;
}

```
      

## Input

```javascript
function component(a) {
  let z = { a };
  (function () {
    (function () {
      z.b = 1;
    })();
  })();
  return z;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a;
  let z;
  if (c_0) {
    z = { a: a };
    (function () {
      (function () {
        z.b = 1;
      })();
    })();
    $[0] = a;
    $[1] = z;
  } else {
    z = $[1];
  }
  return z;
}

```
      
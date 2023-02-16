
## Input

```javascript
function component(a) {
  let z = { a: { a } };
  let x = function () {
    (function () {
      z.a.a;
    })();
  };
  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a: a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let z;
  if (c_2) {
    z = { a: t0 };
    $[2] = t0;
    $[3] = z;
  } else {
    z = $[3];
  }
  const c_4 = $[4] !== z.a.a;
  let x;
  if (c_4) {
    x = function () {
      (function () {
        z.a.a;
      })();
    };
    $[4] = z.a.a;
    $[5] = x;
  } else {
    x = $[5];
  }
  return x;
}

```
      
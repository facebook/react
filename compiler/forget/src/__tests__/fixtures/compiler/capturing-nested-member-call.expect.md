
## Input

```javascript
function component(a) {
  let z = { a: { a } };
  let x = function () {
    z.a.a();
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
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = { a: t0 };
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const z = t1;
  const c_4 = $[4] !== z.a;
  let t2;
  if (c_4) {
    t2 = function () {
      z.a.a();
    };
    $[4] = z.a;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const x = t2;
  return x;
}

```
      
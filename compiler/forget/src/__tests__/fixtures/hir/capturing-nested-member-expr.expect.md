
## Input

```javascript
function component(a) {
  let z = { a: { a } };
  let x = function () {
    z.a.a;
  };
  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let t1;
  if (c_0) {
    t1 = { a: a };
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const c_2 = $[2] !== t1;
  let z;
  if (c_2) {
    z = { a: t1 };
    $[2] = t1;
    $[3] = z;
  } else {
    z = $[3];
  }
  const c_4 = $[4] !== z.a.a;
  let x;
  if (c_4) {
    x = function () {
      z.a.a;
    };
    $[4] = z.a.a;
    $[5] = x;
  } else {
    x = $[5];
  }
  return x;
}

```
      
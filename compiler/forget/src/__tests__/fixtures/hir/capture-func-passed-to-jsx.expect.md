
## Input

```javascript
function component(a, b) {
  let y = { b };
  let z = { a };
  let x = function () {
    z.a = 2;
    y.b;
  };
  let t = <Foo x={x}></Foo>;
  mutate(x); // x should be frozen here
  return t;
}

```

## Code

```javascript
function component(a, b) {
  const $ = React.unstable_useMemoCache(9);
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
  const c_7 = $[7] !== x;
  let t;
  if (c_7) {
    t = <Foo x={x}></Foo>;
    $[7] = x;
    $[8] = t;
  } else {
    t = $[8];
  }
  mutate(x);
  return t;
}

```
      
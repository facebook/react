
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
  let t0;
  if (c_0) {
    t0 = { b };
    $[0] = b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  const c_2 = $[2] !== a;
  let t1;
  if (c_2) {
    t1 = { a };
    $[2] = a;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const z = t1;
  const c_4 = $[4] !== z.a;
  const c_5 = $[5] !== y.b;
  let t2;
  if (c_4 || c_5) {
    t2 = function () {
      z.a = 2;
      y.b;
    };
    $[4] = z.a;
    $[5] = y.b;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  const x = t2;
  const c_7 = $[7] !== x;
  let t3;
  if (c_7) {
    t3 = <Foo x={x} />;
    $[7] = x;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  const t = t3;
  mutate(x);
  return t;
}

```
      
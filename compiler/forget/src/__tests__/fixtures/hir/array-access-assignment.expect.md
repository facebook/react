
## Input

```javascript
function foo(a, b, c) {
  const x = [a];
  const y = [null, b];
  const z = [[], [], [c]];
  x[0] = y[1];
  z[0][0] = x[0];
  return [x, z];
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  let z;
  if (c_0 || c_1 || c_2) {
    x = [a];
    const c_5 = $[5] !== b;
    let y;
    if (c_5) {
      y = [null, b];
      $[5] = b;
      $[6] = y;
    } else {
      y = $[6];
    }
    z = [[], [], [c]];
    x[0] = y[1];
    z[0][0] = x[0];
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
    $[4] = z;
  } else {
    x = $[3];
    z = $[4];
  }
  const c_7 = $[7] !== x;
  const c_8 = $[8] !== z;
  let t0;
  if (c_7 || c_8) {
    t0 = [x, z];
    $[7] = x;
    $[8] = z;
    $[9] = t0;
  } else {
    t0 = $[9];
  }
  return t0;
}

```
      
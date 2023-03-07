
## Input

```javascript
function foo(a, b, c) {
  const x = { a: a };
  // NOTE: this array should memoize independently from x, w only b,c as deps
  x.y = [b, c];

  return x;
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(7);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  if (c_0 || c_1 || c_2) {
    x = { a };
    const c_4 = $[4] !== b;
    const c_5 = $[5] !== c;
    let t0;
    if (c_4 || c_5) {
      t0 = [b, c];
      $[4] = b;
      $[5] = c;
      $[6] = t0;
    } else {
      t0 = $[6];
    }
    x.y = t0;
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      
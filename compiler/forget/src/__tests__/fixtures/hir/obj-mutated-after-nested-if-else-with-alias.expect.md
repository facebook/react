
## Input

```javascript
function foo(a, b, c, d) {
  let x = someObj();
  if (a) {
    let z;
    if (b) {
      const w = someObj();
      z = w;
    } else {
      z = someObj();
    }
    const y = z;
    x = z;
  } else {
    x = someObj();
  }

  x.f = 1;
  return x;
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  let x;
  if (c_0 || c_1) {
    x = someObj();
    if (a) {
      let z = undefined;
      if (b) {
        const w = someObj();
        z = w;
      } else {
        z = someObj();
      }

      x = z;
    } else {
      x = someObj();
    }
    x.f = 1;
    $[0] = a;
    $[1] = b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      

## Input

```javascript
function foo(a, b, c, d) {
  let x = someObj();
  if (a) {
    const y = someObj();
    const z = y;
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
  let x;
  if (c_0) {
    x = someObj();
    if (a) {
      let y;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        y = someObj();
        $[2] = y;
      } else {
        y = $[2];
      }
      const z = y;
      x = z;
    } else {
      x = someObj();
    }
    x.f = 1;
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
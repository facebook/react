
## Input

```javascript
function foo(a) {
  const b = {};
  const x = b;
  if (a) {
    let y = {};
    x.y = y;
  } else {
    let z = {};
    x.z = z;
  }
  mutate(b); // aliases x, y & z
  return x;
}

```

## Code

```javascript
function foo(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    const b = {};
    x = b;

    if (a) {
      let y;

      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        y = {};
        $[2] = y;
      } else {
        y = $[2];
      }

      x.y = y;
    } else {
      let z;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        z = {};
        $[3] = z;
      } else {
        z = $[3];
      }

      x.z = z;
    }

    mutate(b);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  return x;
}

```
      
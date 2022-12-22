
## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
    mutate(y); // aliases x & y, but not z
  } else {
    let z = {};
    x.z = z;
  }
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
    x = {};

    if (a) {
      const y = {};
      x.y = y;
      mutate(y);
    } else {
      let z;

      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        z = {};
        $[2] = z;
      } else {
        z = $[2];
      }

      x.z = z;
    }

    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  return x;
}

```
      
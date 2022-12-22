
## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
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

    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  return x;
}

```
      
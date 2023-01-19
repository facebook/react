
## Input

```javascript
function foo(x, y) {
  if (x) {
    return foo(false, y);
  }
  return [y * 10];
}

```

## Code

```javascript
function foo(x, y) {
  const $ = React.useMemoCache();
  if (x) {
    const c_0 = $[0] !== y;
    let t1;
    if (c_0) {
      t1 = foo(false, y);
      $[0] = y;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    return t1;
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [y * 10];
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

```
      
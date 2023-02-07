
## Input

```javascript
function foo() {
  let x = {};
  let y = [];
  let z = {};
  y.push(z);
  x.y = y;

  return x;
}

```

## Code

```javascript
function foo() {
  const $ = React.unstable_useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    let y;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      y = [];
      const z = {};
      y.push(z);
      $[1] = y;
    } else {
      y = $[1];
    }
    x.y = y;
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      
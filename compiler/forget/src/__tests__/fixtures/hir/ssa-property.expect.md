
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  return y;
}

```

## Code

```javascript
function foo() {
  const $ = React.unstable_useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    $[0] = x;
  } else {
    x = $[0];
  }
  let y;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y = {};
    y.x = x;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      
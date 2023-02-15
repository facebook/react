
## Input

```javascript
function foo(a, b) {
  let x = [];
  if (a) {
    x = 1;
  }

  let y = x;
  return y;
}

```

## Code

```javascript
function foo(a, b) {
  const $ = React.unstable_useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    $[0] = x;
  } else {
    x = $[0];
  }
  if (a) {
    x = 1;
  }

  const y = x;
  return y;
}

```
      

## Input

```javascript
function foo() {
  let x = 1;
  while (x < 10) {
    x = x + 1;
  }

  return x;
}

```

## Code

```javascript
function foo() {
  const $ = React.unstable_useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = 1;
    while (x < 10) {
      x = x + 1;
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      
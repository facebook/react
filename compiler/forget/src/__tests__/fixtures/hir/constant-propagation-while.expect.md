
## Input

```javascript
function foo() {
  let x = 100;
  let y = 0;
  while (x < 10) {
    y += 1;
  }
  return y;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y = 0;
    while (false) {
      y = y + 1;
    }
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      
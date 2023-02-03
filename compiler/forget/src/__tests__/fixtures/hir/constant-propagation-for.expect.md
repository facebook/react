
## Input

```javascript
function foo() {
  let y = 0;
  for (const x = 100; x < 10; x) {
    y = y + 1;
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
    for (const x = 100; false; 100) {
      y = y + 1;
    }
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      
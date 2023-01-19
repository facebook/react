
## Input

```javascript
function foo() {
  let x = 1;
  for (let i = 0; i < 10; i += 1) {
    x += 1;
  }
  return x;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = 1;
    for (let i = 0; i < 10; i = i + 1, i) {
      x = x + 1;
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      

## Input

```javascript
function foo() {
  let x = 1;
  for (let i = 0; i < 10; /* update is intentally a single identifier */ i) {
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

    for (const i = 0; 10, true; 0) {
      x = x + 1;
    }

    $[0] = x;
  } else {
    x = $[0];
  }

  return x;
}

```
      
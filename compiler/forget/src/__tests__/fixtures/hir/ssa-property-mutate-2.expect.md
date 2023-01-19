
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  mutate(x);
  return y;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = [];
    y = {};
    y.x = x;

    mutate(x);
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      
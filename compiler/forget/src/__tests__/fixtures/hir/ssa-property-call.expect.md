
## Input

```javascript
function foo() {
  const x = [];
  const y = { x: x };
  y.x.push([]);
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
    y = { x: x };
    y.x.push([]);
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      
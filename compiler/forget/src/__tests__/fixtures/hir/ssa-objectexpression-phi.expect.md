
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (x > 1) {
    x = 2;
  } else {
    y = 3;
  }

  let t = { x: x, y: y };
  return t;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const x = 1;

  const y = 3;
  let t;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t = { x: x, y: y };
    $[0] = t;
  } else {
    t = $[0];
  }
  return t;
}

```
      

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
  const $ = React.unstable_useMemoCache(1);
  const x = 1;

  const y = 3;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { x, y };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t = t0;
  return t;
}

```
      
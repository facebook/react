
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
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    $[0] = x;
  } else {
    x = $[0];
  }

  const c_1 = $[1] !== x;
  let y;

  if (c_1) {
    y = {
      x: x,
    };
    y.x.push([]);
    $[1] = x;
    $[2] = y;
  } else {
    y = $[2];
  }

  return y;
}

```
      
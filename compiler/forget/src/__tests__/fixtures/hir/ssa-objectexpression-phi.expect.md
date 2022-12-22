
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
  const y = 2;
  let x$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$0 = x;
    let y$1 = y;

    if (x > 1) {
      const x$2 = 2;
      x$0 = x$2;
    } else {
      const y$3 = 3;
      y$1 = y$3;
    }

    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  const c_1 = $[1] !== x$0;
  const c_2 = $[2] !== y$1;
  let t;

  if (c_1 || c_2) {
    t = {
      x: x$0,
      y: y$1,
    };
    $[1] = x$0;
    $[2] = y$1;
    $[3] = t;
  } else {
    t = $[3];
  }

  return t;
}

```
      
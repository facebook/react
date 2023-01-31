
## Input

```javascript
// @only
function sequence(props) {
  let x = (null, Math.max(1, 2), sequence({}));
  if (((x = x + 1), x < 10)) {
    x = 10;
  }
  //   while (((x = x * 2), x < 20)) {
  //     x = ((x = x + 1), x + 1);
  //   }
  return x;
}

```

## Code

```javascript
// @only
function sequence(props) {
  const $ = React.useMemoCache();
  null;
  Math.max(1, 2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = sequence({});
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  const x$0 = x + 1;
  let x$1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    x$1 = x$0;
    if (x$0 < 10) {
      const x$2 = 10;
      x$1 = x$2;
    }
    $[1] = x$1;
  } else {
    x$1 = $[1];
  }
  return x$1;
}

```
      
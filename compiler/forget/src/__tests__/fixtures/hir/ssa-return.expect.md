
## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }

  return x;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const x = 1;
  let x$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$0 = x;

    if (x === 1) {
      const x$1 = 2;
      x$0 = x$1;
    }

    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  return x$0;
}

```
      
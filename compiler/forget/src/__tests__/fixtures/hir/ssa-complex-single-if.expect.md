
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  y = x;
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

    if (y === 2) {
      const x$1 = 3;
      x$0 = x$1;
    }

    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  const y$2 = x$0;
}

```
      
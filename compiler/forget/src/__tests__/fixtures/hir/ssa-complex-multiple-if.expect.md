
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  if (y === 3) {
    x = 5;
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

  let x$2;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    x$2 = x$0;

    if (y === 3) {
      const x$3 = 5;
      x$2 = x$3;
    }

    $[1] = x$2;
  } else {
    x$2 = $[1];
  }

  const y$4 = x$2;
}

```
      
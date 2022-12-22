
## Input

```javascript
function foo() {
  let y = 2;

  if (y > 1) {
    y = 1;
  } else {
    y = 2;
  }

  let x = y;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const y = 2;
  let y$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y$0 = undefined;

    if (y > 1) {
      const y$1 = 1;
      y$0 = y$1;
    } else {
      const y$2 = 2;
      y$0 = y$2;
    }

    $[0] = y$0;
  } else {
    y$0 = $[0];
  }

  const x = y$0;
}

```
      
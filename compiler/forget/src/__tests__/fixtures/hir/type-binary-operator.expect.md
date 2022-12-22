
## Input

```javascript
function component() {
  let a = some();
  let b = someOther();
  if (a > b) {
    let m = {};
  }
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = some();
    $[0] = a;
  } else {
    a = $[0];
  }

  let b;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    b = someOther();
    $[1] = b;
  } else {
    b = $[1];
  }

  if (a > b) {
    const m = {};
  }
}

```
      
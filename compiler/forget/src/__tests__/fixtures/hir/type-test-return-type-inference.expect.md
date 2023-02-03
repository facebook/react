
## Input

```javascript
function component() {
  let x = foo();
  let y = foo();
  if (x > y) {
    let z = {};
  }

  let z = foo();
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = foo();
    $[0] = x;
  } else {
    x = $[0];
  }
  let y;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y = foo();
    $[1] = y;
  } else {
    y = $[1];
  }
  if (x > y) {
  }

  const z_0 = foo();
}

```
      
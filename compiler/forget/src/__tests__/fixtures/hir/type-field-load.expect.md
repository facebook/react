
## Input

```javascript
function component() {
  let x = { t: 1 };
  let p = x.t;
  return p;
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = { t: 1 };
    $[0] = x;
  } else {
    x = $[0];
  }
  const p = x.t;
  return p;
}

```
      
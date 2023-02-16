
## Input

```javascript
function Component(props) {
  const a = 1;
  const b = 2;
  const x = { a: a, b: b };
  return x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(1);
  const a = 1;
  const b = 2;
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = { a: a, b: b };
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      
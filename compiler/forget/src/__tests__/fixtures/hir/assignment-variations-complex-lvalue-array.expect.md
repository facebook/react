
## Input

```javascript
function foo() {
  const a = [[1]];
  const first = a.at(0);
  first.set(0, 2);
  return a;
}

```

## Code

```javascript
function foo() {
  const $ = React.unstable_useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [[1]];
    const first = a.at(0);
    first.set(0, 2);
    $[0] = a;
  } else {
    a = $[0];
  }
  return a;
}

```
      
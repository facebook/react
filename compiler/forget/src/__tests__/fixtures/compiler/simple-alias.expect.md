
## Input

```javascript
function mutate() {}
function foo() {
  let a = {};
  let b = {};
  let c = {};
  a = b;
  b = c;
  c = a;
  mutate(a, b);
  return c;
}

```

## Code

```javascript
function mutate() {
  return undefined;
}
function foo() {
  const $ = React.unstable_useMemoCache(1);
  let c;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let b = {};
    c = {};
    const a = b;
    b = c;
    c = a;
    mutate(a, b);
    $[0] = c;
  } else {
    c = $[0];
  }
  return c;
}

```
      

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
function mutate() {}
function foo() {
  const $ = React.unstable_useMemoCache();
  let c$1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const b = {};
    const c = {};
    const a = b;
    const b$0 = c;
    c$1 = a;
    mutate(a, b$0);
    $[0] = c$1;
  } else {
    c$1 = $[0];
  }
  return c$1;
}

```
      

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
  const $ = React.useMemoCache();
  const a = {};
  let c$2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const b = {};
    const c = {};
    const a$0 = b;
    const b$1 = c;
    c$2 = a$0;
    mutate(a$0, b$1);
    $[0] = c$2;
  } else {
    c$2 = $[0];
  }
  return c$2;
}

```
      
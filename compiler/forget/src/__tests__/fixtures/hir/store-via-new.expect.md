
## Input

```javascript
function Foo() {
  const x = {};
  const y = new Foo(x);
  y.mutate();
  return x;
}

```

## Code

```javascript
function Foo() {
  const $ = React.unstable_useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    const y = new Foo(x);
    y.mutate();
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      
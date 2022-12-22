
## Input

```javascript
function foo() {
  const a = {};
  const y = a;
  const x = [];

  y.x = x;

  mutate(a); // y & x are aliased to a
  return y;
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = {};
    y = a;
    let x;

    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      x = [];
      $[1] = x;
    } else {
      x = $[1];
    }

    y.x = x;
    mutate(a);
    $[0] = y;
  } else {
    y = $[0];
  }

  return y;
}

```
      
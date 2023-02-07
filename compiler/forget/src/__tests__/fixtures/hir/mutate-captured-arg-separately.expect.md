
## Input

```javascript
function component(a) {
  let y = function () {
    m(x);
  };

  let x = { a };
  m(x);
  return y;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache();
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y = function () {
      m(x);
    };
    $[0] = y;
  } else {
    y = $[0];
  }

  const x = { a: a };
  m(x);
  return y;
}

```
      
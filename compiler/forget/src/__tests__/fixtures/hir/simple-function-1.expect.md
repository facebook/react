
## Input

```javascript
function component() {
  let x = function (a) {
    a.foo();
  };
  return x;
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function (a) {
      a.foo();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x;
}

```
      
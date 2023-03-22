
## Input

```javascript
function Component() {
  const x = {};
  {
    let x = 56;
    const fn = function () {
      x = 42;
    };
    fn();
  }
  return x; // should return {}
}

```

## Code

```javascript
function Component() {
  const $ = React.unstable_useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;

  const fn = function () {
    x = 42;
  };
  fn();
  return x;
}

```
      

## Input

```javascript
function component() {
  let z = 100;
  let x;
  {
    x = function () {
      z;
    };
  }
  return x;
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  const z = 100;
  const x = undefined;
  let x$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$0 = function () {
      z;
    };

    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  return x$0;
}

```
      
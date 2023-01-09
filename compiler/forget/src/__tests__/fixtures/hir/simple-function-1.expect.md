
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
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = function (a) {
      a.foo();
    };

    $[0] = x;
  } else {
    x = $[0];
  }

  return x;
}

```
      
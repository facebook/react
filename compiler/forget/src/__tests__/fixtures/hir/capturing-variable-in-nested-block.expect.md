
## Input

```javascript
function component() {
  let z = 100;
  let x = function () {
    {
      z;
    }
  };
  return x;
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  const z = 100;
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = function () {
      {
        z;
      }
    };

    $[0] = x;
  } else {
    x = $[0];
  }

  return x;
}

```
      
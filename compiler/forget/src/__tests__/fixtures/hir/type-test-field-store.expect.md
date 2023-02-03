
## Input

```javascript
function component() {
  let x = {};
  let q = {};
  x.t = q;
  let z = x.t;
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  const x = {};
  let q;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    q = {};
    $[0] = q;
  } else {
    q = $[0];
  }
  x.t = q;
}

```
      
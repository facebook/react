
## Input

```javascript
function sequence(props) {
  let x = (null, Math.max(1, 2), foo());
  while ((foo(), true)) {
    x = (foo(), 2);
  }
  return x;
}

function foo() {}

```

## Code

```javascript
function sequence(props) {
  const $ = React.unstable_useMemoCache(1);
  Math.max(1, 2);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = foo();
    while ((foo(), true)) {
      foo();
      x = 2;
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

function foo() {}

```
      
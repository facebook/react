
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
  const $ = React.useMemoCache();
  null;
  Math.max(1, 2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = foo();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c_1 = $[1] !== t0;
  let x;
  if (c_1) {
    x = t0;
    while ((foo(), true)) {
      foo();
      2;
      x = 2;
    }
    $[1] = t0;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

function foo() {}

```
      
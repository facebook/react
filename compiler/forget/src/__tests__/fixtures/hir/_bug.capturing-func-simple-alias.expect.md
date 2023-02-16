
## Input

```javascript
function component(a) {
  let x = { a };
  let y;
  (function () {
    y = x;
  })();
  mutate(y);
  return y;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = { a: a };
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const y = undefined;
  (function () {
    y = x;
  })();
  mutate(y);
  return y;
}

```
      
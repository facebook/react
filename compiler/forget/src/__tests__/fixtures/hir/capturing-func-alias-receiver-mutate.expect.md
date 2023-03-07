
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};
  (function () {
    let a = y;
    a.x = x;
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
  let y;
  if (c_0) {
    const x = { a };
    y = {};
    (function () {
      let a = y;
      a.x = x;
    })();
    mutate(y);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      
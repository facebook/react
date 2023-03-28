
## Input

```javascript
function bar(a) {
  let x = [a];
  let y = {};
  (function () {
    y = x[0];
  })();

  return y;
}

```

## Code

```javascript
function bar(a) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let y;
  if (c_0) {
    const x = [a];
    y = {};
    (function () {
      y = x[0];
    })();
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      
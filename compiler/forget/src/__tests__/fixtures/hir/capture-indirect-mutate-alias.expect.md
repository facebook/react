
## Input

```javascript
function component(a) {
  let x = { a };
  (function () {
    let q = x;
    (function () {
      q.b = 1;
    })();
  })();

  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = { a: a };
    (function () {
      let q = x;
      (function () {
        q.b = 1;
      })();
    })();
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
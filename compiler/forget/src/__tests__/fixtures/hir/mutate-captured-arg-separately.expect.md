
## Input

```javascript
function component(a) {
  let y = function () {
    m(x);
  };

  let x = { a };
  m(x);
  return y;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a;
  let y;
  if (c_0) {
    y = function () {
      m(x);
    };

    const x = { a: a };
    m(x);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      
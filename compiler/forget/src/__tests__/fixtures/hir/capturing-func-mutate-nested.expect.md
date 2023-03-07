
## Input

```javascript
function component(a) {
  let y = { b: { a } };
  let x = function () {
    y.b.a = 2;
  };
  x();
  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    const y = { b: { a } };
    x = function () {
      y.b.a = 2;
    };
    x();
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
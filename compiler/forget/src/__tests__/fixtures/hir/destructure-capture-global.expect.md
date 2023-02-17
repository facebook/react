
## Input

```javascript
let someGlobal = {};
function component(a) {
  let x = { a, someGlobal };
  return x;
}

```

## Code

```javascript
let someGlobal = {};
function component(a) {
  const $ = React.unstable_useMemoCache(3);
  const t0 = someGlobal;
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== t0;
  let x;
  if (c_0 || c_1) {
    x = { a: a, someGlobal: t0 };
    $[0] = a;
    $[1] = t0;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
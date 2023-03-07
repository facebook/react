
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
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a, someGlobal };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

```
      
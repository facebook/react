
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
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = { a: a, someGlobal: someGlobal };
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
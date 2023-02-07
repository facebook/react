
## Input

```javascript
function foo(a, b) {
  let x = 0;
  while (a.b.c) {
    x += b;
  }
  return x;
}

```

## Code

```javascript
function foo(a, b) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a.b.c;
  const c_1 = $[1] !== b;
  let x;
  if (c_0 || c_1) {
    x = 0;
    while (a.b.c) {
      x = x + b;
    }
    $[0] = a.b.c;
    $[1] = b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
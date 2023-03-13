
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    if (b) {
      if (c) {
        x.push(0);
      }
    }
  }
  if (x.length) {
    return x;
  }
  return null;
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  if (c_0 || c_1 || c_2) {
    x = [];
    if (a) {
      if (b) {
        if (c) {
          x.push(0);
        }
      }
    }
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }
  if (x.length) {
    return x;
  }
  return null;
}

```
      
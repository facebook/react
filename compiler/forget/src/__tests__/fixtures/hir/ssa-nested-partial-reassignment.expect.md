
## Input

```javascript
function foo(a, b, c, d, e) {
  let x = null;
  if (a) {
    x = b;
  } else {
    if (c) {
      x = d;
    }
  }
  return x;
}

```

## Code

```javascript
function foo(a, b, c, d, e) {
  const $ = React.useMemoCache();
  const x = null;
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  const c_3 = $[3] !== d;
  let x$0;
  if (c_0 || c_1 || c_2 || c_3) {
    x$0 = x;
    if (a) {
      const x$1 = b;
      x$0 = x$1;
    } else {
      if (c) {
        const x$2 = d;
        x$0 = x$2;
      }
    }
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
    $[4] = x$0;
  } else {
    x$0 = $[4];
  }
  return x$0;
}

```
      
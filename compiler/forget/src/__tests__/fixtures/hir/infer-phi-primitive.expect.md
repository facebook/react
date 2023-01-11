
## Input

```javascript
function foo(a, b) {
  let x;
  if (a) {
    x = 1;
  } else {
    x = 2;
  }

  let y = x;
  return y;
}

```

## Code

```javascript
function foo(a, b) {
  const $ = React.useMemoCache();
  const x = undefined;
  const c_0 = $[0] !== a;
  let x$0;
  if (c_0) {
    x$0 = undefined;

    if (a) {
      const x$1 = 1;
      x$0 = x$1;
    } else {
      const x$2 = 2;
      x$0 = x$2;
    }

    $[0] = a;
    $[1] = x$0;
  } else {
    x$0 = $[1];
  }

  const y = x$0;
  return y;
}

```
      
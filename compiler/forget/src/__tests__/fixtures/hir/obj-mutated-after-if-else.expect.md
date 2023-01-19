
## Input

```javascript
function foo(a, b, c, d) {
  let x = someObj();
  if (a) {
    x = someObj();
  } else {
    x = someObj();
  }

  x.f = 1;
  return x;
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const $ = React.useMemoCache();
  const x = someObj();
  const c_0 = $[0] !== a;
  let x$0;
  if (c_0) {
    x$0 = undefined;
    if (a) {
      const x$1 = someObj();
      x$0 = x$1;
    } else {
      const x$2 = someObj();
      x$0 = x$2;
    }
    x$0.f = 1;
    $[0] = a;
    $[1] = x$0;
  } else {
    x$0 = $[1];
  }
  return x$0;
}

```
      
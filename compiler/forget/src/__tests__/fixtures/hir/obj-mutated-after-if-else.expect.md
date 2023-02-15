
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
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = someObj();
    if (a) {
      x = someObj();
    } else {
      x = someObj();
    }
    x.f = 1;
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
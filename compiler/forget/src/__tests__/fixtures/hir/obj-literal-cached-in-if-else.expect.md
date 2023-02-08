
## Input

```javascript
function foo(a, b, c, d) {
  let x = {};
  if (someVal) {
    x = { b };
  } else {
    x = { c };
  }

  return x;
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const $ = React.unstable_useMemoCache();
  let x = undefined;
  if (someVal) {
    const c_0 = $[0] !== b;
    let x$0;
    if (c_0) {
      x$0 = { b: b };
      $[0] = b;
      $[1] = x$0;
    } else {
      x$0 = $[1];
    }
    x = x$0;
  } else {
    const c_2 = $[2] !== c;
    let x$1;
    if (c_2) {
      x$1 = { c: c };
      $[2] = c;
      $[3] = x$1;
    } else {
      x$1 = $[3];
    }
    x = x$1;
  }
  return x;
}

```
      
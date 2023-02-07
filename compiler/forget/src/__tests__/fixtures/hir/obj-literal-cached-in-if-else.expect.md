
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
  const c_0 = $[0] !== b;
  const c_1 = $[1] !== c;
  let x;
  if (c_0 || c_1) {
    x = undefined;
    if (someVal) {
      const c_3 = $[3] !== b;
      let x$0;
      if (c_3) {
        x$0 = { b: b };
        $[3] = b;
        $[4] = x$0;
      } else {
        x$0 = $[4];
      }
      x = x$0;
    } else {
      const c_5 = $[5] !== c;
      let x$1;
      if (c_5) {
        x$1 = { c: c };
        $[5] = c;
        $[6] = x$1;
      } else {
        x$1 = $[6];
      }
      x = x$1;
    }
    $[0] = b;
    $[1] = c;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      

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
    if (c_0) {
      x = { b: b };
      $[0] = b;
      $[1] = x;
    } else {
      x = $[1];
    }
  } else {
    const c_2 = $[2] !== c;
    if (c_2) {
      x = { c: c };
      $[2] = c;
      $[3] = x;
    } else {
      x = $[3];
    }
  }
  return x;
}

```
      
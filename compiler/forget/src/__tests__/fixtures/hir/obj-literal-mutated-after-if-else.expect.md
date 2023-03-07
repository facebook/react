
## Input

```javascript
function foo(a, b, c, d) {
  let x = {};
  if (someVal) {
    x = { b };
  } else {
    x = { c };
  }

  x.f = 1;
  return x;
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== b;
  const c_1 = $[1] !== c;
  let x;
  if (c_0 || c_1) {
    x = undefined;
    if (someVal) {
      x = { b };
    } else {
      x = { c };
    }
    x.f = 1;
    $[0] = b;
    $[1] = c;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
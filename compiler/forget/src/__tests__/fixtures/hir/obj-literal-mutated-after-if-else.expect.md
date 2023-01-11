
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
  const $ = React.useMemoCache();
  const x = {};
  const c_0 = $[0] !== b;
  const c_1 = $[1] !== c;
  let x$0;
  if (c_0 || c_1) {
    x$0 = undefined;

    if (someVal) {
      const x$1 = {
        b: b,
      };
      x$0 = x$1;
    } else {
      const x$2 = {
        c: c,
      };
      x$0 = x$2;
    }

    x$0.f = 1;
    $[0] = b;
    $[1] = c;
    $[2] = x$0;
  } else {
    x$0 = $[2];
  }

  return x$0;
}

```
      

## Input

```javascript
function foo(a, b, c) {
  let x;
  if (a) {
    x = 2 - 1;
  } else {
    x = 0 + 1;
  }
  if (x === 1) {
    return b;
  } else {
    return c;
  }
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = undefined;
  let x$0 = undefined;
  if (a) {
    2;
    1;

    const x$1 = 1;
    x$0 = x$1;
  } else {
    0;
    1;

    const x$2 = 1;
    x$0 = x$2;
  }
  1;
  true;
  return b;
}

```
      
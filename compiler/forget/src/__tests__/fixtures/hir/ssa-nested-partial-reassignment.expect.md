
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
  const x = null;
  let x$0 = x;
  if (a) {
    const x$1 = b;
    x$0 = x$1;
  } else {
    if (c) {
      const x$2 = d;
      x$0 = x$2;
    }
  }
  return x$0;
}

```
      
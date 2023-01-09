
## Input

```javascript
function foo(a, b, c, d) {
  let x = 0;
  if (true) {
    if (true) {
      x = a;
    } else {
      x = b;
    }
    x;
  } else {
    if (true) {
      x = c;
    } else {
      x = d;
    }
    x;
  }
  return x;
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const x = 0;
  true;
  true;
  const x$0 = a;
  x$0;
  return x$0;
}

```
      
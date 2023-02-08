
## Input

```javascript
function foo(a, b, c) {
  let x = a;
  if (b) {
    if (c) {
      x = c;
    }
    // TODO: move the return to the end of the function
    return x;
  }
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = a;
  if (b) {
    let x$0 = x;
    if (c) {
      const x$1 = c;
      x$0 = x$1;
    }
    return x$0;
  }
}

```
      
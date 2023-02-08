
## Input

```javascript
function foo(a, b) {
  let x;
  if (a) {
    x = 1;
  } else {
    x = 2;
  }

  let y = x;
  return y;
}

```

## Code

```javascript
function foo(a, b) {
  let x = undefined;
  if (a) {
    const x$0 = 1;
    x = x$0;
  } else {
    const x$1 = 2;
    x = x$1;
  }

  const y = x;
  return y;
}

```
      
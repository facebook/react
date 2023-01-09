
## Input

```javascript
// @xonly
function foo(a, b, c) {
  let x = 0;
  while (a) {
    while (b) {
      while (c) {
        x + 1;
      }
    }
  }
  return x;
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = 0;
  while (a) {
    while (b) {
      while (c) {
        1;
        1;
      }
    }
  }

  return x;
}

```
      
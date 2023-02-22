
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
// @xonly
function foo(a, b, c) {
  while (a) {
    while (b) {
      while (c) {}
    }
  }
  return 0;
}

```
      
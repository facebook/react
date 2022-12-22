
## Input

```javascript
function f() {
  let x = 1;
  // BUG: `x` has different values within this expression. Currently, the
  // assignment is evaluated too early.
  return x + (x = 2) + x;
}

```

## Code

```javascript
function f() {
  const x = 1;
  const x$0 = 2;
  return x$0 + x$0 + x$0;
}

```
      

## Input

```javascript
function f(y) {
  let x = y;
  return x + (x = 2) + x;
}

```

## Code

```javascript
function f(y) {
  const x = y;
  return x + 2 + 2;
}

```
      
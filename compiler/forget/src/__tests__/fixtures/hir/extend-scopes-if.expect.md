
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    if (b) {
      if (c) {
        x.push(0);
      }
    }
  }
  if (a.length) {
    return a;
  }
  return null;
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = [];
  if (a) {
    if (b) {
      if (c) {
        x.push(0);
      }
    }
  }
  if (a.length) {
    return a;
  }
  return null;
}

```
      

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
  let x = a;
  if (b) {
    if (c) {
      x = c;
    }
    return x;
  }
  return undefined;
}

```
      
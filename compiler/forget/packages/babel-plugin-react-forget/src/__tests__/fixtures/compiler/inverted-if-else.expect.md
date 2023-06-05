
## Input

```javascript
function foo(a, b, c) {
  let x = null;
  label: {
    if (a) {
      x = b;
      break label;
    }
    x = c;
  }
  return x;
}

```

## Code

```javascript
function foo(a, b, c) {
  let x = undefined;
  bb1: {
    if (a) {
      x = b;
      break bb1;
    }

    x = c;
  }
  return x;
}

```
      
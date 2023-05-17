
## Input

```javascript
function foo(a, b, c) {
  label: if (a) {
    while (b) {
      if (c) {
        break label;
      }
    }
  }
  return c;
}

```

## Code

```javascript
function foo(a, b, c) {
  bb1: {
    if (a) {
      while (b) {
        if (c) {
          break bb1;
        }
      }
    }
  }
  return c;
}

```
      
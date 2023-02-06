
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
  if (a) {
    while (b) {
      if (c) {
        break;
      }
    }
  }
  return c;
}

```
      

## Input

```javascript
function foo(a, b, c) {
  label: if (a) {
    while (b) {
      if (c) {
        break;
      }
    }
  }
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
}

```
      
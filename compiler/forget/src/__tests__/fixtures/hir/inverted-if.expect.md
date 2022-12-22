
## Input

```javascript
function foo(a, b, c) {
  let y = [];
  label: if (a) {
    if (b) {
      y.push(c);
      break label;
    }
  }
}

```

## Code

```javascript
function foo(a, b, c) {
  const y = [];
  if (a) {
    if (b) {
      y.push(c);
    }
  }
}

```
      
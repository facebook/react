
## Input

```javascript
function foo(a, b, c) {
  let x = a;
  if (b) {
    if (c) {
      x = c;
    }
    x;
  }
}

```

## Code

```javascript
function foo(a, b, c) {
  if (b) {
    if (c) {
    }
  }
}

```
      
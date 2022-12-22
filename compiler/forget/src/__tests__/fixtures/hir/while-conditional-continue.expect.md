
## Input

```javascript
function foo(a, b, c, d) {
  while (a) {
    if (b) {
      continue;
    }
    c();
    continue;
  }
  d();
}

```

## Code

```javascript
function foo(a, b, c, d) {
  while (a) {
    if (b) {
      continue;
    }
    c();
  }

  d();
}

```
      
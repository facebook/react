
## Input

```javascript
function foo(a, b, c) {
  const x = { ...a };
  x[b] = c[b];
  x[1 + 2] = c[b * 4];
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = { ...a };
  x[b] = c[b];
  x[3] = c[b * 4];
}

```
      
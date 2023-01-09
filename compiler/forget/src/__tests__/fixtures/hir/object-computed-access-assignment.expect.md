
## Input

```javascript
function foo(a, b, c) {
  a[b] = c[b];
  a[1 + 2] = c[b * 4];
}

```

## Code

```javascript
function foo(a, b, c) {
  a[b] = c[b];
  1;
  2;
  a[3] = c[b * 4];
}

```
      
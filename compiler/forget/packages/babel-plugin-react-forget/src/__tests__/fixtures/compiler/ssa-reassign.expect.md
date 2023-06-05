
## Input

```javascript
function foo(a, b, c) {
  let x = 0;
  x = a;
  x = b;
  x = c;
  return x;
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = c;
  return x;
}

```
      
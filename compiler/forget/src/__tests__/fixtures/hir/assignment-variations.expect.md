
## Input

```javascript
function f() {
  let x = 1;
  x = x + 1;
  x += 1;
  x >>>= 1;
  return x;
}

```

## Code

```javascript
function f() {
  const x = 3;
  const x$0 = x >>> 1;
  return x$0;
}

```
      
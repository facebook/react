
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
  let x = 3;
  x = x >>> 1;
  return x;
}

```
      
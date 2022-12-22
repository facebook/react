
## Input

```javascript
function f() {
  let x = 1;
  x = x + 1;
  x += 1;
  x >>>= 1;
}

```

## Code

```javascript
function f() {
  const x = 1;
  const x$0 = x + 1;
  const x$1 = x$0 + 1;
  const x$2 = x$1 >>> 1;
}

```
      

## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }
  throw x;
}

```

## Code

```javascript
function foo() {
  const x = 2;
  throw x;
}

```
      
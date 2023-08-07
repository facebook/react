
## Input

```javascript
function foo() {
  let x = 1;
  for (let i = 0; i < 10; i++) {
    x += 1;
  }
  return x;
}

```

## Code

```javascript
function foo() {
  let x = 1;
  for (let i = 0; i < 10; i++) {
    x = x + 1;
  }
  return x;
}

```
      
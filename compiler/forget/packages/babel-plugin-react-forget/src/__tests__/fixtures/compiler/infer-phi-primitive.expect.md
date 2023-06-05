
## Input

```javascript
function foo(a, b) {
  let x;
  if (a) {
    x = 1;
  } else {
    x = 2;
  }

  let y = x;
  return y;
}

```

## Code

```javascript
function foo(a, b) {
  let x = undefined;
  if (a) {
    x = 1;
  } else {
    x = 2;
  }

  const y = x;
  return y;
}

```
      
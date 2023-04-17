
## Input

```javascript
function foo() {
  let x = 1;

  switch (x) {
    case 1: {
      x = x + 1;
      break;
    }
    case 2: {
      x = x + 2;
      break;
    }
    default: {
      x = x + 3;
    }
  }

  let y = x;
}

```

## Code

```javascript
function foo() {
  bb1: switch (1) {
    case 1: {
      break bb1;
    }
    case 2: {
      break bb1;
    }
    default: {
    }
  }
  return undefined;
}

```
      
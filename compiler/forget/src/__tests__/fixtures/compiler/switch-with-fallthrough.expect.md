
## Input

```javascript
function foo(x) {
  let y;
  switch (x) {
    case 0: {
      y = 0;
    }
    case 1: {
      y = 1;
    }
    case 2: {
      break;
    }
    case 3: {
      y = 3;
      break;
    }
    case 4: {
      y = 4;
    }
    case 5: {
      y = 5;
    }
    default: {
      y = 0;
    }
  }
}

```

## Code

```javascript
function foo(x) {
  bb1: switch (x) {
    case 0: {
    }
    case 1: {
    }
    case 2: {
      break bb1;
    }
    case 3: {
      break bb1;
    }
    case 4: {
    }
    case 5: {
    }
    default: {
    }
  }
}

```
      
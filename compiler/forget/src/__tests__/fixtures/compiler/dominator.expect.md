
## Input

```javascript
function Component(props) {
  let x = 0;
  label: if (props.a) {
    x = 1;
  } else {
    if (props.b) {
      x = 2;
    } else {
      break label;
    }
    x = 3;
  }
  label2: switch (props.c) {
    case "a": {
      x = 4;
      break;
    }
    case "b": {
      break label2;
    }
    case "c": {
      x = 5;
      // intentional fallthrough
    }
    default: {
      x = 6;
    }
  }
  if (props.d) {
    return null;
  }
  return x;
}

```

## Code

```javascript
function Component(props) {
  let x = 0;
  bb1: if (props.a) {
    x = 1;
  } else {
    if (props.b) {
      x = 3;
    } else {
      break bb1;
    }
  }
  bb10: bb12: switch (props.c) {
    case "a": {
      x = 4;
      break bb12;
    }
    case "b": {
      break bb10;
    }
    case "c": {
    }
    default: {
      x = 6;
    }
  }
  if (props.d) {
    return null;
  }
  return x;
}

```
      
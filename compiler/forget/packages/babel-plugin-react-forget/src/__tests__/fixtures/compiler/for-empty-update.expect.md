
## Input

```javascript
function Component(props) {
  let x = 0;
  for (let i = 0; i < props.count; ) {
    x += i;
    if (x > 10) {
      break;
    }
  }
  return x;
}

```

## Code

```javascript
function Component(props) {
  let x = 0;
  for (const i = 0; 0 < props.count; ) {
    x = x + 0;
    if (x > 10) {
      break;
    }
  }
  return x;
}

```
      
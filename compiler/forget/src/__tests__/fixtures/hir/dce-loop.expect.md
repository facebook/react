
## Input

```javascript
function foo(props) {
  let x = 0;
  let y = 0;
  while (y < props.max) {
    x++;
    y++;
  }
  return y;
}

```

## Code

```javascript
function foo(props) {
  let y = 0;
  while (y < props.max) {
    y = y + 1;
  }
  return y;
}

```
      
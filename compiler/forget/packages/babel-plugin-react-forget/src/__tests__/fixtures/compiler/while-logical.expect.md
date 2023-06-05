
## Input

```javascript
function foo(props) {
  let x = 0;
  while (x > props.min && x < props.max) {
    x *= 2;
  }
  return x;
}

```

## Code

```javascript
function foo(props) {
  let x = 0;
  while (x > props.min && x < props.max) {
    x = x * 2;
  }
  return x;
}

```
      
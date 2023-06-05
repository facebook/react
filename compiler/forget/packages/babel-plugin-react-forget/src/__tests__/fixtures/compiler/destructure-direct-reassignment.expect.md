
## Input

```javascript
function foo(props) {
  let x, y;
  ({ x, y } = { x: props.a, y: props.b });
  console.log(x); // prevent DCE from eliminating `x` altogether
  x = props.c;
  return x + y;
}

```

## Code

```javascript
function foo(props) {
  let { x, y } = { x: props.a, y: props.b };
  console.log(x);
  x = props.c;
  return x + y;
}

```
      
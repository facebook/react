
## Input

```javascript
function foo(props) {
  const [x, y, ...z] = props.a;
  return x + y;
}

```

## Code

```javascript
function foo(props) {
  const [x, y] = props.a;
  return x + y;
}

```
      
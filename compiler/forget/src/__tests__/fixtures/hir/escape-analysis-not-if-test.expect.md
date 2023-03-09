
## Input

```javascript
function Component(props) {
  const x = [props.a];
  let y;
  if (x) {
    y = props.b;
  } else {
    y = props.c;
  }
  return y;
}

```

## Code

```javascript
function Component(props) {
  const x = [props.a];
  let y = undefined;
  if (x) {
    y = props.b;
  } else {
    y = props.c;
  }
  return y;
}

```
      
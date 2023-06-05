
## Input

```javascript
function component(props) {
  let a = props.a || (props.b && props.c && props.d);
  let b = (props.a && props.b && props.c) || props.d;
  return a ? b : props.c;
}

```

## Code

```javascript
function component(props) {
  const a = props.a || (props.b && props.c && props.d);
  const b = (props.a && props.b && props.c) || props.d;
  return a ? b : props.c;
}

```
      
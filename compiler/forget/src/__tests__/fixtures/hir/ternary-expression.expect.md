
## Input

```javascript
function ternary(props) {
  const a = props.a && props.b ? props.c || props.d : props.e ?? props.f;
  const b = props.a ? (props.b && props.c ? props.d : props.e) : props.f;
  return a ? b : null;
}

```

## Code

```javascript
function ternary(props) {
  const a = props.a && props.b ? props.c || props.d : props.e ?? props.f;
  const b = props.a ? (props.b && props.c ? props.d : props.e) : props.f;
  return a ? b : null;
}

```
      

## Input

```javascript
// @debug
function Component(props) {
  const x = makeObject();
  const y = delete x[props.value];
  return y;
}

```

## Code

```javascript
// @debug
function Component(props) {
  const x = makeObject();
  const y = delete x[props.value];
  return y;
}

```
      
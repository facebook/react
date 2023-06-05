
## Input

```javascript
function Component(props) {
  if (props.cond) {
    return undefined;
  }
  return props.value;
}

```

## Code

```javascript
function Component(props) {
  if (props.cond) {
    return;
  }
  return props.value;
}

```
      
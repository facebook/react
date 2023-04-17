
## Input

```javascript
// @inlineUseMemo
function Component(props) {
  const x = useMemo(() => {
    switch (props.key) {
      case "key": {
        return props.value;
      }
      default: {
        return props.defaultValue;
      }
    }
  });
  return x;
}

```

## Code

```javascript
// @inlineUseMemo
function Component(props) {
  let t13 = undefined;
  bb8: switch (props.key) {
    case "key": {
      t13 = props.value;
      break bb8;
    }
    default: {
      t13 = props.defaultValue;
    }
  }
  const x = t13;
  return x;
}

```
      
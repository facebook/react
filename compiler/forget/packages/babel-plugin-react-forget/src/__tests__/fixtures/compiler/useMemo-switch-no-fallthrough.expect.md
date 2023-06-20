
## Input

```javascript
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
function Component(props) {
  let t17 = undefined;
  bb8: switch (props.key) {
    case "key": {
      t17 = props.value;
      break bb8;
    }
    default: {
      t17 = props.defaultValue;
    }
  }
  const x = t17;
  return x;
}

```
      
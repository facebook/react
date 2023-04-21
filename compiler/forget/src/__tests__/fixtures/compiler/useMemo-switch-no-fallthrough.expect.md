
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
  let t14 = undefined;
  bb8: switch (props.key) {
    case "key": {
      t14 = props.value;
      break bb8;
    }
    default: {
      t14 = props.defaultValue;
    }
  }
  const x = t14;
  return x;
}

```
      
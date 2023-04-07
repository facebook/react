
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
  bb8: switch (props.key) {
    case "key": {
      const t28 = props.value;
      break bb8;
    }
    default: {
      const t28 = props.defaultValue;
    }
  }
  const x = t28;
  return x;
}

```
      
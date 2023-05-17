
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
  let t18 = undefined;
  bb8: {
    switch (props.key) {
      case "key": {
        t18 = props.value;
        break bb8;
      }
      default: {
        t18 = props.defaultValue;
      }
    }
  }
  const x = t18;
  return x;
}

```
      

## Input

```javascript
function Component(props) {
  const x = useMemo(() => {
    label: {
      if (props.cond) {
        break label;
      }
      return props.a;
    }
    return props.b;
  });
  return x;
}

```

## Code

```javascript
function Component(props) {
  let t17 = undefined;
  bb10: {
    if (props.cond) {
      t17 = props.b;
      break bb10;
    }
    t17 = props.a;
  }
  const x = t17;
  return x;
}

```
      
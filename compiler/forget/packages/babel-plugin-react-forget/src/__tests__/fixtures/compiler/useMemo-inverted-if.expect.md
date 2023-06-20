
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
  let t16 = undefined;
  bb10: {
    bb5: {
      if (props.cond) {
        break bb5;
      }

      t16 = props.a;
      break bb10;
    }

    t16 = props.b;
  }
  const x = t16;
  return x;
}

```
      

## Input

```javascript
function Component(props) {
  const x = useMemo(() => {
    let y;
    switch (props.switch) {
      case "foo": {
        return "foo";
      }
      case "bar": {
        y = "bar";
        break;
      }
      default: {
        y = props.y;
      }
    }
    return y;
  });
  return x;
}

```

## Code

```javascript
function Component(props) {
  let t22 = undefined;
  bb10: {
    let y = undefined;
    bb2: switch (props.switch) {
      case "foo": {
        t22 = "foo";
        break bb10;
      }
      case "bar": {
        y = "bar";
        break bb2;
      }
      default: {
        y = props.y;
      }
    }

    t22 = y;
  }
  const x = t22;
  return x;
}

```
      
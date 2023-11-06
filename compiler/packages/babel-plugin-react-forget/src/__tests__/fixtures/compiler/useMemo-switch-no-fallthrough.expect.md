
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

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
function Component(props) {
  let t17;
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

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      

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
  let t38;
  bb9: switch (props.key) {
    case "key": {
      t38 = props.value;
      break bb9;
    }
    default: {
      t38 = props.defaultValue;
    }
  }
  const x = t38;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
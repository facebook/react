
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

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
function Component(props) {
  let t49;
  bb11: {
    let y = undefined;
    bb2: switch (props.switch) {
      case "foo": {
        t49 = "foo";
        break bb11;
      }
      case "bar": {
        y = "bar";
        break bb2;
      }
      default: {
        y = props.y;
      }
    }

    t49 = y;
  }
  const x = t49;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
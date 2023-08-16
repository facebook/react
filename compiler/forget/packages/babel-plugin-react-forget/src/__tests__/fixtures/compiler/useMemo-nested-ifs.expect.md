
## Input

```javascript
function Component(props) {
  const x = useMemo(() => {
    if (props.cond) {
      if (props.cond) {
      }
    }
  }, [props.cond]);
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
  if (props.cond) {
    if (props.cond) {
    }
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
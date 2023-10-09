
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
  let t31;
  if (props.cond) {
    if (props.cond) {
    }
  }
  t31 = undefined;
  const x = t31;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
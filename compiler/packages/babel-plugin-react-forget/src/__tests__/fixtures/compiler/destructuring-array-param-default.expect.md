
## Input

```javascript
function Component([a = 2]) {
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
function Component(t13) {
  const [t14] = t13;
  const a = t14 === undefined ? 2 : t14;
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
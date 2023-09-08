
## Input

```javascript
function Component(props) {
  // destructure slot index has an explicit undefined in the input, should return default
  const [x = 42] = props.value;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [undefined] }],
};

```

## Code

```javascript
function Component(props) {
  const [t18] = props.value;
  const x = t18 === undefined ? 42 : t18;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [undefined] }],
};

```
      
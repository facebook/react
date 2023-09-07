
## Input

```javascript
function foo({ "data-foo-bar": dataTestID }) {
  return dataTestID;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{ "data-foo-bar": {} }],
  isComponent: false,
};

```

## Code

```javascript
function foo(t5) {
  const { "data-foo-bar": dataTestID } = t5;
  return dataTestID;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{ "data-foo-bar": {} }],
  isComponent: false,
};

```
      

## Input

```javascript
function foo({ data: dataTestID }) {
  return dataTestID;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{ data: {} }],
  isComponent: false,
};

```

## Code

```javascript
function foo(t5) {
  const { data: dataTestID } = t5;
  return dataTestID;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{ data: {} }],
  isComponent: false,
};

```
      
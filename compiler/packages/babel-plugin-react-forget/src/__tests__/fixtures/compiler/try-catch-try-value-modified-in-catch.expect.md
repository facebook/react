
## Input

```javascript
const { throwInput } = require("shared-runtime");

function Component(props) {
  try {
    const y = [];
    y.push(props.y);
    throwInput(y);
  } catch (e) {
    e.push(props.e);
    return e;
  }
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: "foo", e: "bar" }],
};

```

## Code

```javascript
const { throwInput } = require("shared-runtime");

function Component(props) {
  try {
    const y = [];
    y.push(props.y);
    throwInput(y);
  } catch (t25) {
    const e = t25;
    e.push(props.e);
    return e;
  }
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: "foo", e: "bar" }],
};

```
      
### Eval output
(kind: ok) ["foo","bar"]
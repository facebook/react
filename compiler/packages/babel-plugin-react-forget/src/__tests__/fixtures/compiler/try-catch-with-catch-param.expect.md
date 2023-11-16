
## Input

```javascript
const { throwInput } = require("shared-runtime");

function Component(props) {
  let x = [];
  try {
    // foo could throw its argument...
    throwInput(x);
  } catch (e) {
    // ... in which case this could be mutating `x`!
    e.push(null);
    return e;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
const { throwInput } = require("shared-runtime");

function Component(props) {
  const x = [];
  try {
    throwInput(x);
  } catch (t22) {
    const e = t22;

    e.push(null);
    return e;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [null]
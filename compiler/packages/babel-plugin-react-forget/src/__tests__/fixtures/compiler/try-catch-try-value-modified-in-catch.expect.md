
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
import { unstable_useMemoCache as useMemoCache } from "react";
const { throwInput } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(3);
  let t49;
  if ($[0] !== props.y || $[1] !== props.e) {
    t49 = Symbol.for("react.early_return_sentinel");
    bb18: {
      try {
        const y = [];
        y.push(props.y);
        throwInput(y);
      } catch (t25) {
        const e = t25;
        e.push(props.e);
        t49 = e;
        break bb18;
      }

      t49 = null;
      break bb18;
    }
    $[0] = props.y;
    $[1] = props.e;
    $[2] = t49;
  } else {
    t49 = $[2];
  }
  if (t49 !== Symbol.for("react.early_return_sentinel")) {
    return t49;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: "foo", e: "bar" }],
};

```
      
### Eval output
(kind: ok) ["foo","bar"]
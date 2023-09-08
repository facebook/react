
## Input

```javascript
const { throwInput } = require("shared-runtime");

function Component(props) {
  let x;
  try {
    const y = [];
    y.push(props.y);
    throwInput(y);
  } catch (e) {
    e.push(props.e);
    x = e;
  }
  return x;
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
  let x;
  const c_0 = $[0] !== props.y;
  const c_1 = $[1] !== props.e;
  if (c_0 || c_1) {
    try {
      const y = [];
      y.push(props.y);
      throwInput(y);
    } catch (t30) {
      const e = t30;
      e.push(props.e);
      x = e;
    }
    $[0] = props.y;
    $[1] = props.e;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: "foo", e: "bar" }],
};

```
      
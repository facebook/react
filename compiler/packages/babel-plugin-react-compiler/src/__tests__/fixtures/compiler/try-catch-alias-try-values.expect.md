
## Input

```javascript
const { throwInput } = require("shared-runtime");

function Component(props) {
  let y;
  let x = [];
  try {
    // throws x
    throwInput(x);
  } catch (e) {
    // e = x
    y = e; // y = x
  }
  y.push(null);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const { throwInput } = require("shared-runtime");

function Component(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let y;
    const x = [];
    try {
      throwInput(x);
    } catch (t1) {
      const e = t1;

      y = e;
    }

    t0 = x;
    y.push(null);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [null]
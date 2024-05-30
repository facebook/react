
## Input

```javascript
const { throwErrorWithMessage, shallowCopy } = require("shared-runtime");

function Component(props) {
  const x = [];
  try {
    x.push(throwErrorWithMessage("oops"));
  } catch {
    x.push(shallowCopy({}));
  }
  x.push(props.value); // extend the mutable range to include the try/catch
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
const { throwErrorWithMessage, shallowCopy } = require("shared-runtime");

function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.value) {
    const x = [];
    try {
      let t1;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = throwErrorWithMessage("oops");
        $[2] = t1;
      } else {
        t1 = $[2];
      }
      x.push(t1);
    } catch {
      let t1;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = shallowCopy({});
        $[3] = t1;
      } else {
        t1 = $[3];
      }
      x.push(t1);
    }

    t0 = x;
    x.push(props.value);
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [{},null]
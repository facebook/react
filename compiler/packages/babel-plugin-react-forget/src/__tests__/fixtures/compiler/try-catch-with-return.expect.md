
## Input

```javascript
const { shallowCopy, throwInput } = require("shared-runtime");

function Component(props) {
  let x = [];
  try {
    const y = shallowCopy({});
    if (y == null) {
      return;
    }
    x.push(throwInput(y));
  } catch {
    return null;
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
import { unstable_useMemoCache as useMemoCache } from "react";
const { shallowCopy, throwInput } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(2);
  let x;
  let t43;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t43 = Symbol.for("react.early_return_sentinel");
    bb25: {
      x = [];
      try {
        const y = shallowCopy({});
        if (y == null) {
          t43 = undefined;
          break bb25;
        }

        x.push(throwInput(y));
      } catch {
        t43 = null;
        break bb25;
      }
    }
    $[0] = x;
    $[1] = t43;
  } else {
    x = $[0];
    t43 = $[1];
  }
  if (t43 !== Symbol.for("react.early_return_sentinel")) {
    return t43;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) null
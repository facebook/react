
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
import { unstable_useMemoCache as useMemoCache } from "react";
const { throwInput } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = Symbol.for("react.early_return_sentinel");
    bb12: {
      const x = [];
      try {
        throwInput(x);
      } catch (t1) {
        const e = t1;
        e.push(null);
        t0 = e;
        break bb12;
      }

      t0 = x;
      break bb12;
    }
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  if (t0 !== Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [null]
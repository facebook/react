
## Input

```javascript
// @enableEarlyReturnInReactiveScopes
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
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEarlyReturnInReactiveScopes
const { throwInput } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(1);
  let t36;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t36 = Symbol.for("react.memo_cache_sentinel");
    bb11: {
      const x = [];
      try {
        throwInput(x);
      } catch (t22) {
        const e = t22;
        e.push(null);
        t36 = e;
        break bb11;
      }

      t36 = x;
      break bb11;
    }
    $[0] = t36;
  } else {
    t36 = $[0];
  }
  if (t36 !== Symbol.for("react.memo_cache_sentinel")) {
    return t36;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [null]
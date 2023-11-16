
## Input

```javascript
const { shallowCopy, throwInput } = require("shared-runtime");

// @debug
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

// @debug
function Component(props) {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    try {
      const y = shallowCopy({});
      if (y == null) {
        return;
      }

      x.push(throwInput(y));
    } catch {
      return null;
    }
    $[0] = x;
  } else {
    x = $[0];
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
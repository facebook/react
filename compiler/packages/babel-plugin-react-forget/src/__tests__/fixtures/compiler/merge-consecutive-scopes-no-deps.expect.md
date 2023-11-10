
## Input

```javascript
const { getNumber } = require("shared-runtime");

function Component(props) {
  // Two scopes: one for `getNumber()`, one for the object literal.
  // Neither has dependencies so they should merge
  return { session_id: getNumber() };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
const { getNumber } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { session_id: getNumber() };
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
      

## Input

```javascript
import { useMemo } from "react";
import { makeArray } from "shared-runtime";

function Component() {
  const x = useMemo(makeArray, []);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
import { useMemo } from "react";
import { makeArray } from "shared-runtime";

function Component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeArray();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
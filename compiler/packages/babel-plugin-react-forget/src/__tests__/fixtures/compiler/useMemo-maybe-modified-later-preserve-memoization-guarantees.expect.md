
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees
import { useMemo } from "react";
import { identity, makeObject_Primitives, mutate } from "shared-runtime";

function Component(props) {
  const object = useMemo(() => makeObject_Primitives(), []);
  identity(object);
  return object;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
// @enablePreserveExistingMemoizationGuarantees
import { useMemo, unstable_useMemoCache as useMemoCache } from "react";
import { identity, makeObject_Primitives, mutate } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(1);
  let t7;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeObject_Primitives();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  t7 = t0;
  const object = t7;
  identity(object);
  return object;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) {"a":0,"b":"value1","c":true}
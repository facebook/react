
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees
import { useMemo } from "react";
import {
  identity,
  makeObject_Primitives,
  mutate,
  useHook,
} from "shared-runtime";

function Component(props) {
  const free = makeObject_Primitives();
  const free2 = makeObject_Primitives();
  const part = free2.part;
  useHook();
  const object = useMemo(() => {
    const x = makeObject_Primitives();
    x.value = props.value;
    mutate(x, free, part);
    return x;
  }, [props.value]);
  return object;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
// @enablePreserveExistingMemoizationGuarantees
import { useMemo, unstable_useMemoCache as useMemoCache } from "react";
import {
  identity,
  makeObject_Primitives,
  mutate,
  useHook,
} from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeObject_Primitives();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const free = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = makeObject_Primitives();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const free2 = t1;
  const part = free2.part;
  useHook();
  let t39;
  let x;
  if ($[2] !== props.value) {
    x = makeObject_Primitives();
    x.value = props.value;
    mutate(x, free, part);
    $[2] = props.value;
    $[3] = x;
  } else {
    x = $[3];
  }
  t39 = x;
  const object = t39;
  return object;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) {"a":0,"b":"value1","c":true,"value":42,"wat0":"joe"}
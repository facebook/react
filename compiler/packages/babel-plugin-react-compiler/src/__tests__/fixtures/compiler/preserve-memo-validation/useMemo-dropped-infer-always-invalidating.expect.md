
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import { useMemo } from "react";
import { useHook } from "shared-runtime";

// useMemo values may not be memoized in Forget output if we
// infer that their deps always invalidate.
// This is still correct as the useMemo in source was effectively
// a no-op already.
function useFoo(props) {
  const x = [];
  useHook();
  x.push(props);

  return useMemo(() => [x], [x]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

import { useMemo } from "react";
import { useHook } from "shared-runtime";

// useMemo values may not be memoized in Forget output if we
// infer that their deps always invalidate.
// This is still correct as the useMemo in source was effectively
// a no-op already.
function useFoo(props) {
  const $ = _c(4);

  useHook();
  let x;
  if ($[0] !== props) {
    x = [];
    x.push(props);
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  let t0;
  let t1;
  if ($[2] !== x) {
    t1 = [x];
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  t0 = t1;
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [[{}]]
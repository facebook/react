
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useMemo} from 'react';

// More specific memoization always results in fewer memo block
// executions.
// Precisely:
//  x_new != x_prev does NOT imply x.y.z_new != x.y.z_prev
//  x.y.z_new != x.y.z_prev does imply x_new != x_prev
function useHook(x) {
  return useMemo(() => [x.y.z], [x]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{y: {z: 2}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

import { useMemo } from "react";

// More specific memoization always results in fewer memo block
// executions.
// Precisely:
//  x_new != x_prev does NOT imply x.y.z_new != x.y.z_prev
//  x.y.z_new != x.y.z_prev does imply x_new != x_prev
function useHook(x) {
  const $ = _c(2);
  let t0;
  let t1;
  if ($[0] !== x.y.z) {
    t1 = [x.y.z];
    $[0] = x.y.z;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{ y: { z: 2 } }],
};

```
      
### Eval output
(kind: ok) [2]
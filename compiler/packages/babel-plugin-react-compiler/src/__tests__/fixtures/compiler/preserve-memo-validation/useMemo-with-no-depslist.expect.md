
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';

// Compiler can produce any memoization it finds valid if the
// source listed no memo deps
function Component({propA}) {
  // @ts-ignore
  return useMemo(() => {
    return [propA];
  });
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propA: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useMemo } from "react";

// Compiler can produce any memoization it finds valid if the
// source listed no memo deps
function Component(t0) {
  const $ = _c(2);
  const { propA } = t0;
  let t1;
  let t2;
  if ($[0] !== propA) {
    t2 = [propA];
    $[0] = propA;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  t1 = t2;
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propA: 2 }],
};

```
      
### Eval output
(kind: ok) [2]
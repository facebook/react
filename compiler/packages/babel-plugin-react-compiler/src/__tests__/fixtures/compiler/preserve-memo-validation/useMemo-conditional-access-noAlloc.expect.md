
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';

function Component({propA, propB}) {
  return useMemo(() => {
    return {
      value: propB?.x.y,
      other: propA,
    };
  }, [propA, propB.x.y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propA: 2, propB: {x: {y: []}}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useMemo } from "react";

function Component(t0) {
  const $ = _c(3);
  const { propA, propB } = t0;
  let t1;

  const t2 = propB?.x.y;
  let t3;
  if ($[0] !== t2 || $[1] !== propA) {
    t3 = { value: t2, other: propA };
    $[0] = t2;
    $[1] = propA;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  t1 = t3;
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propA: 2, propB: { x: { y: [] } } }],
};

```
      
### Eval output
(kind: ok) {"value":[],"other":2}
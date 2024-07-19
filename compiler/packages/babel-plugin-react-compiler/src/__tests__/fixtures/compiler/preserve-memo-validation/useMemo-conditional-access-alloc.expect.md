
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {identity} from 'shared-runtime';

function Component({propA, propB}) {
  return useMemo(() => {
    return {
      value: identity(propB?.x.y),
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
import { identity } from "shared-runtime";

function Component(t0) {
  const $ = _c(5);
  const { propA, propB } = t0;
  let t1;

  const t2 = propB?.x.y;
  let t3;
  if ($[0] !== t2) {
    t3 = identity(t2);
    $[0] = t2;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  let t4;
  if ($[2] !== t3 || $[3] !== propA) {
    t4 = { value: t3, other: propA };
    $[2] = t3;
    $[3] = propA;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  t1 = t4;
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propA: 2, propB: { x: { y: [] } } }],
};

```
      
### Eval output
(kind: ok) {"value":[],"other":2}
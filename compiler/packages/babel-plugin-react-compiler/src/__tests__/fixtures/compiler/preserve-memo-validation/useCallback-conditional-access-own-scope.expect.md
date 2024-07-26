
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';

function Component({propA, propB}) {
  return useCallback(() => {
    if (propA) {
      return {
        value: propB.x.y,
      };
    }
  }, [propA, propB.x.y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propA: 1, propB: {x: {y: []}}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useCallback } from "react";

function Component(t0) {
  const $ = _c(3);
  const { propA, propB } = t0;
  let t1;
  if ($[0] !== propA || $[1] !== propB.x.y) {
    t1 = () => {
      if (propA) {
        return { value: propB.x.y };
      }
    };
    $[0] = propA;
    $[1] = propB.x.y;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propA: 1, propB: { x: { y: [] } } }],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"
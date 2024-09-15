
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';
import {identity, mutate} from 'shared-runtime';

function useHook(propA, propB) {
  return useCallback(() => {
    const x = {};
    if (identity(null) ?? propA.a) {
      mutate(x);
      return {
        value: propB.x.y,
      };
    }
  }, [propA.a, propB.x.y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{a: 1}, {x: {y: 3}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useCallback } from "react";
import { identity, mutate } from "shared-runtime";

function useHook(propA, propB) {
  const $ = _c(3);
  let t0;
  if ($[0] !== propA.a || $[1] !== propB.x.y) {
    t0 = () => {
      const x = {};
      if (identity(null) ?? propA.a) {
        mutate(x);
        return { value: propB.x.y };
      }
    };
    $[0] = propA.a;
    $[1] = propB.x.y;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{ a: 1 }, { x: { y: 3 } }],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"
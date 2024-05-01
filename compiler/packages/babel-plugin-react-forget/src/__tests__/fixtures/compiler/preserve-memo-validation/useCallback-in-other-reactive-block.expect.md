
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import { useCallback, useState } from "react";
import { arrayPush } from "shared-runtime";

// useCallback-produced values can exist in nested reactive blocks, as long
// as their reactive dependencies are a subset of depslist from source
function useFoo(minWidth, otherProp) {
  const [width, setWidth] = useState(1);
  const x = [];
  const style = useCallback(() => {
    return {
      width: Math.max(minWidth, width),
    };
  }, [width, minWidth]);
  arrayPush(x, otherProp);
  return [style, x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2, "other"],
};

```

## Code

```javascript
// @validatePreserveExistingMemoizationGuarantees
import { useCallback, useState, c as useMemoCache } from "react";
import { arrayPush } from "shared-runtime";

// useCallback-produced values can exist in nested reactive blocks, as long
// as their reactive dependencies are a subset of depslist from source
function useFoo(minWidth, otherProp) {
  const $ = useMemoCache(11);
  const [width] = useState(1);
  let style;
  let x;
  if ($[0] !== width || $[1] !== minWidth || $[2] !== otherProp) {
    x = [];
    let t0;
    if ($[5] !== minWidth || $[6] !== width) {
      t0 = () => ({ width: Math.max(minWidth, width) });
      $[5] = minWidth;
      $[6] = width;
      $[7] = t0;
    } else {
      t0 = $[7];
    }
    style = t0;

    arrayPush(x, otherProp);
    $[0] = width;
    $[1] = minWidth;
    $[2] = otherProp;
    $[3] = style;
    $[4] = x;
  } else {
    style = $[3];
    x = $[4];
  }
  let t0;
  if ($[8] !== style || $[9] !== x) {
    t0 = [style, x];
    $[8] = style;
    $[9] = x;
    $[10] = t0;
  } else {
    t0 = $[10];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2, "other"],
};

```
      
### Eval output
(kind: ok) ["[[ function params=0 ]]",["other"]]
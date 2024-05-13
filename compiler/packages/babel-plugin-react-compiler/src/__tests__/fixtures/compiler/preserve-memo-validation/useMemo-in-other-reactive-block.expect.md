
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import { useMemo, useState } from "react";
import { arrayPush } from "shared-runtime";

// useMemo-produced values can exist in nested reactive blocks, as long
// as their reactive dependencies are a subset of depslist from source
function useFoo(minWidth, otherProp) {
  const [width, setWidth] = useState(1);
  const x = [];
  const style = useMemo(() => {
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
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useMemo, useState } from "react";
import { arrayPush } from "shared-runtime";

// useMemo-produced values can exist in nested reactive blocks, as long
// as their reactive dependencies are a subset of depslist from source
function useFoo(minWidth, otherProp) {
  const $ = _c(10);
  const [width] = useState(1);
  let style;
  let x;
  if ($[0] !== width || $[1] !== minWidth || $[2] !== otherProp) {
    x = [];
    let t0;

    const t1 = Math.max(minWidth, width);
    let t2;
    if ($[5] !== t1) {
      t2 = { width: t1 };
      $[5] = t1;
      $[6] = t2;
    } else {
      t2 = $[6];
    }
    t0 = t2;
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
  if ($[7] !== style || $[8] !== x) {
    t0 = [style, x];
    $[7] = style;
    $[8] = x;
    $[9] = t0;
  } else {
    t0 = $[9];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2, "other"],
};

```
      
### Eval output
(kind: ok) [{"width":2},["other"]]
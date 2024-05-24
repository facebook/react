
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
  const $ = _c(11);
  let t0;
  const [width] = useState(1);
  let style;
  let x;
  if ($[0] !== minWidth || $[1] !== width || $[2] !== otherProp) {
    x = [];

    const t1 = Math.max(minWidth, width);
    let t2;
    if ($[6] !== t1) {
      t2 = { width: t1 };
      $[6] = t1;
      $[7] = t2;
    } else {
      t2 = $[7];
    }
    t0 = t2;
    style = t0;

    arrayPush(x, otherProp);
    $[0] = minWidth;
    $[1] = width;
    $[2] = otherProp;
    $[3] = style;
    $[4] = x;
    $[5] = t0;
  } else {
    style = $[3];
    x = $[4];
    t0 = $[5];
  }
  let t1;
  if ($[8] !== style || $[9] !== x) {
    t1 = [style, x];
    $[8] = style;
    $[9] = x;
    $[10] = t1;
  } else {
    t1 = $[10];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2, "other"],
};

```
      
### Eval output
(kind: ok) [{"width":2},["other"]]
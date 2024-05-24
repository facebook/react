
## Input

```javascript
import { useMemo } from "react";

function useFoo(arr1, arr2) {
  const x = [arr1];

  let y;
  return useMemo(() => {
    return { y };
  }, [((y = x.concat(arr2)), y)]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [
    [1, 2],
    [3, 4],
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";

function useFoo(arr1, arr2) {
  const $ = _c(7);
  let y;
  if ($[0] !== arr1 || $[1] !== arr2) {
    y;
    let t0;
    if ($[3] !== arr1) {
      t0 = [arr1];
      $[3] = arr1;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    const x = t0;
    (y = x.concat(arr2)), y;
    $[0] = arr1;
    $[1] = arr2;
    $[2] = y;
  } else {
    y = $[2];
  }
  let t0;
  const t1 = y;
  let t2;
  if ($[5] !== t1) {
    t2 = { y: t1 };
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  t0 = t2;
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [
    [1, 2],
    [3, 4],
  ],
};

```
      
### Eval output
(kind: ok) {"y":[[1,2],3,4]}
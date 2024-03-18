
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
import { useMemo, unstable_useMemoCache as useMemoCache } from "react";

function useFoo(arr1, arr2) {
  const $ = useMemoCache(7);
  let t0;
  if ($[0] !== arr1) {
    t0 = [arr1];
    $[0] = arr1;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  let y;
  if ($[2] !== x || $[3] !== arr2) {
    y;
    (y = x.concat(arr2)), y;
    $[2] = x;
    $[3] = arr2;
    $[4] = y;
  } else {
    y = $[4];
  }
  let t1;
  const t2 = y;
  let t3;
  if ($[5] !== t2) {
    t3 = { y: t2 };
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  t1 = t3;
  return t1;
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
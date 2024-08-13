
## Input

```javascript
import {useMemo} from 'react';

function useFoo(arr1, arr2) {
  const x = [arr1];

  let y;
  return useMemo(() => {
    return {y};
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
  const $ = _c(5);
  let y;
  if ($[0] !== arr1 || $[1] !== arr2) {
    const x = [arr1];

    y;
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
  if ($[3] !== t1) {
    t2 = { y: t1 };
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
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
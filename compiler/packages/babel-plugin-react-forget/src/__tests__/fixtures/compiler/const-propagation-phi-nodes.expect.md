
## Input

```javascript
function useFoo(setOne: boolean) {
  let x;
  let y;
  let z;
  if (setOne) {
    x = y = z = 1;
  } else {
    x = 2;
    y = 3;
    z = 5;
  }
  return { x, y, z };
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [true],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function useFoo(setOne) {
  const $ = useMemoCache(1);
  let x;
  let y;
  let z;
  if (setOne) {
    x = y = z = 1;
  } else {
    x = 2;
    y = 3;
    z = 5;
  }
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { x, y, z };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [true],
};

```
      

## Input

```javascript
function foo() {
  const a = [[1]];
  const first = a.at(0);
  first.set(0, 2);
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo() {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [1];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [t0];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const a = t1;
  const first = a.at(0);
  first.set(0, 2);
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
};

```
      
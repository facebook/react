
## Input

```javascript
import { makeArray } from "shared-runtime";

// @flow
function Component() {
  const items = makeArray(0, 1, 2);
  let item;
  let sum = 0;
  while ((item = items.pop())) {
    sum += item;
  }
  return [items, sum];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { makeArray } from "shared-runtime";

// @flow
function Component() {
  const $ = _c(4);

  let item;
  let sum = 0;
  let items;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    items = makeArray(0, 1, 2);
    while ((item = items.pop())) {
      sum = sum + item;
    }
    $[0] = items;
    $[1] = item;
    $[2] = sum;
  } else {
    items = $[0];
    item = $[1];
    sum = $[2];
  }
  let t0;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [items, sum];
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [[],3]

## Input

```javascript
// @enableTransitivelyFreezeFunctionExpressions
const { mutate } = require("shared-runtime");

function Component(props) {
  const x = {};
  const y = {};
  const items = [x, y];
  items.pop();
  <div>{items}</div>; // note: enableTransitivelyFreezeFunctionExpressions only visits function expressions, not arrays, so this doesn't freeze x/y
  mutate(y); // ok! not part of `items` anymore bc of items.pop()
  return [x, y, items];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableTransitivelyFreezeFunctionExpressions
const { mutate } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(4);
  let x;
  let y;
  let items;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    y = {};
    items = [x, y];
    items.pop();

    mutate(y);
    $[0] = x;
    $[1] = y;
    $[2] = items;
  } else {
    x = $[0];
    y = $[1];
    items = $[2];
  }
  let t0;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [x, y, items];
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
      
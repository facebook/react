
## Input

```javascript
// @debug
function Component(props) {
  const x = {};
  let y;
  if (props.cond) {
    y = {};
  } else {
    y = { a: props.a };
  }
  // This should be inferred as `<store> y` s.t. `x` can still
  // be independently memoized. *But* this also must properly
  // extend the mutable range of the object literals in the
  // if/else branches
  y.x = x;

  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false, a: "a!" }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @debug
function Component(props) {
  const $ = useMemoCache(7);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  let y;
  if ($[1] !== props || $[2] !== x) {
    if (props.cond) {
      y = {};
    } else {
      y = { a: props.a };
    }

    y.x = x;
    $[1] = props;
    $[2] = x;
    $[3] = y;
  } else {
    y = $[3];
  }
  let t1;
  if ($[4] !== x || $[5] !== y) {
    t1 = [x, y];
    $[4] = x;
    $[5] = y;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false, a: "a!" }],
};

```
      
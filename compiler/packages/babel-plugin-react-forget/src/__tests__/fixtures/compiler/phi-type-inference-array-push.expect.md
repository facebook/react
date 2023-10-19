
## Input

```javascript
function Component(props) {
  const x = {};
  let y;
  if (props.cond) {
    y = [props.value];
  } else {
    y = [];
  }
  // This should be inferred as `<store> y` s.t. `x` can still
  // be independently memoized. *But* this also must properly
  // extend the mutable range of the array literals in the
  // if/else branches
  y.push(x);

  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, value: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
  let x;
  let y;
  if ($[0] !== props) {
    x = {};
    if (props.cond) {
      y = [props.value];
    } else {
      y = [];
    }

    y.push(x);
    $[0] = props;
    $[1] = x;
    $[2] = y;
  } else {
    x = $[1];
    y = $[2];
  }
  let t0;
  if ($[3] !== x || $[4] !== y) {
    t0 = [x, y];
    $[3] = x;
    $[4] = y;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, value: 42 }],
};

```
      

## Input

```javascript
function Component(props) {
  let x = 0;
  let y = 0;

  while (x === 0) {
    x = y;
    y = props.value;
  }

  // x and y initially start out with non-reactive values,
  // but after an iteration of the loop y becomes reactive,
  // and this reactive value then flows into x on the next
  // loop iteration, making x reactive.
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let x = 0;
  let y = 0;
  while (x === 0) {
    x = y;
    y = props.value;
  }
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [x];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
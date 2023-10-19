
## Input

```javascript
function Component(props) {
  let x;
  let i = 0;
  do {
    if (i > 10) {
      x = 10;
    } else {
      x = 1;
    }
    i++;
  } while (i < props.test);
  // The values assigned to `x` are non-reactive, but the value of `x`
  // depends on the "control" variable `i`, whose value is affected by
  // `props.test` which is reactive.
  // Therefore x should be treated as reactive too.
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ test: 12 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let x;
  let i = 0;
  do {
    if (i > 10) {
      x = 10;
    } else {
      x = 1;
    }

    i++;
  } while (i < props.test);
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
  params: [{ test: 12 }],
};

```
      
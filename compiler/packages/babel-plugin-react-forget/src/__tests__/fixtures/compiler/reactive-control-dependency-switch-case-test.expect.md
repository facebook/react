
## Input

```javascript
function Component(props) {
  let x;
  switch (props.cond) {
    case true: {
      x = 1;
      break;
    }
    case false: {
      x = 2;
      break;
    }
    default: {
      x = 3;
    }
  }
  // The values assigned to `x` are non-reactive, but the value of `x`
  // depends on the "control" value `props.cond` which is reactive.
  // Therefore x should be treated as reactive too.
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  let x;
  bb1: switch (props.cond) {
    case true: {
      x = 1;
      break bb1;
    }
    case false: {
      x = 2;
      break bb1;
    }
    default: {
      x = 3;
    }
  }
  let t0;
  if ($[0] !== x) {
    t0 = [x];
    $[0] = x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true }],
};

```
      
### Eval output
(kind: ok) [1]
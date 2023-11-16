
## Input

```javascript
const GLOBAL = 42;

function Component({ value }) {
  let x;
  switch (GLOBAL) {
    case value: {
      x = 1;
      break;
    }
    default: {
      x = 2;
    }
  }
  // The values assigned to `x` are non-reactive, but the value of `x`
  // depends on the "control" value `props.value` which is reactive.
  // Therefore x should be treated as reactive too.
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: GLOBAL }],
  // TODO: test executing the sequence {value: GLOBAL}, {value: null}, {value: GLOBAL}
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
const GLOBAL = 42;

function Component(t14) {
  const $ = useMemoCache(2);
  const { value } = t14;
  let x;
  bb1: switch (GLOBAL) {
    case value: {
      x = 1;
      break bb1;
    }
    default: {
      x = 2;
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
  params: [{ value: GLOBAL }],
  // TODO: test executing the sequence {value: GLOBAL}, {value: null}, {value: GLOBAL}
};

```
      
### Eval output
(kind: ok) [1]
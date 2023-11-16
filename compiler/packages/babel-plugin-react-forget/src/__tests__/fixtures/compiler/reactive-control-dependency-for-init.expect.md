
## Input

```javascript
function Component(props) {
  let x;
  for (let i = props.init; i < 10; i++) {
    if (i === 0) {
      x = 0;
      break;
    } else {
      x = 1;
      break;
    }
  }
  // The values assigned to `x` are non-reactive, but the value of `x`
  // depends on the "control" variable `i`, whose initial value `props.init` is reactive.
  // Therefore x should be treated as reactive too.
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ init: 0 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  let x;
  for (const i = props.init; i < 10; ) {
    if (i === 0) {
      x = 0;
      break;
    } else {
      x = 1;
      break;
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
  params: [{ init: 0 }],
};

```
      
### Eval output
(kind: ok) [0]
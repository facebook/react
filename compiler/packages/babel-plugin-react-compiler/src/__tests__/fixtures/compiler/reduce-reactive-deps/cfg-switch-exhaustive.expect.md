
## Input

```javascript
// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

import { identity } from "shared-runtime";

function useCondDepInSwitch(props, other) {
  const x = {};
  switch (identity(other)) {
    case 1:
      x.a = props.a.b;
      break;
    case 2:
      x.b = props.a.b;
      break;
    default:
      x.c = props.a.b;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useCondDepInSwitch,
  params: [{ a: { b: 2 } }, 2],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

import { identity } from "shared-runtime";

function useCondDepInSwitch(props, other) {
  const $ = _c(5);
  let t0;
  if ($[0] !== other) {
    t0 = identity(other);
    $[0] = other;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let x;
  if ($[2] !== t0 || $[3] !== props.a.b) {
    x = {};
    bb0: switch (t0) {
      case 1: {
        x.a = props.a.b;
        break bb0;
      }
      case 2: {
        x.b = props.a.b;
        break bb0;
      }
      default: {
        x.c = props.a.b;
      }
    }
    $[2] = t0;
    $[3] = props.a.b;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useCondDepInSwitch,
  params: [{ a: { b: 2 } }, 2],
};

```
      
### Eval output
(kind: ok) {"b":2}
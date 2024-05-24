
## Input

```javascript
// props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in every path

import { identity } from "shared-runtime";

function useCondDepInSwitchMissingCase(props, other) {
  const x = {};
  switch (identity(other)) {
    case 1:
      x.a = props.a.b;
      break;
    case 2:
      x.b = 42;
      break;
    default:
      x.c = props.a.b;
      break;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useCondDepInSwitchMissingCase,
  params: [{ a: { b: 2 } }, 2],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in every path

import { identity } from "shared-runtime";

function useCondDepInSwitchMissingCase(props, other) {
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
  if ($[2] !== t0 || $[3] !== props) {
    x = {};
    bb0: switch (t0) {
      case 1: {
        x.a = props.a.b;
        break bb0;
      }
      case 2: {
        x.b = 42;
        break bb0;
      }
      default: {
        x.c = props.a.b;
      }
    }
    $[2] = t0;
    $[3] = props;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useCondDepInSwitchMissingCase,
  params: [{ a: { b: 2 } }, 2],
};

```
      
### Eval output
(kind: ok) {"b":42}
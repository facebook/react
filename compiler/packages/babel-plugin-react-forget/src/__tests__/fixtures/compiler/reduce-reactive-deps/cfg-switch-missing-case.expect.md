
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
import { unstable_useMemoCache as useMemoCache } from "react"; // props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in every path

import { identity } from "shared-runtime";

function useCondDepInSwitchMissingCase(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== other || $[1] !== props) {
    x = {};
    bb1: switch (identity(other)) {
      case 1: {
        x.a = props.a.b;
        break bb1;
      }
      case 2: {
        x.b = 42;
        break bb1;
      }
      default: {
        x.c = props.a.b;
      }
    }
    $[0] = other;
    $[1] = props;
    $[2] = x;
  } else {
    x = $[2];
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
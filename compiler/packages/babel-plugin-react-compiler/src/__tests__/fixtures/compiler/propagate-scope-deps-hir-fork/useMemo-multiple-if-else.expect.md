
## Input

```javascript
// @enablePropagateDepsInHIR
import {useMemo} from 'react';

function Component(props) {
  const x = useMemo(() => {
    let y = [];
    if (props.cond) {
      y.push(props.a);
    }
    if (props.cond2) {
      return y;
    }
    y.push(props.b);
    return y;
  });
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1, b: 2, cond2: false}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePropagateDepsInHIR
import { useMemo } from "react";

function Component(props) {
  const $ = _c(6);
  let t0;
  bb0: {
    let y;
    if (
      $[0] !== props.a ||
      $[1] !== props.b ||
      $[2] !== props.cond ||
      $[3] !== props.cond2
    ) {
      y = [];
      if (props.cond) {
        y.push(props.a);
      }
      if (props.cond2) {
        t0 = y;
        break bb0;
      }

      y.push(props.b);
      $[0] = props.a;
      $[1] = props.b;
      $[2] = props.cond;
      $[3] = props.cond2;
      $[4] = y;
      $[5] = t0;
    } else {
      y = $[4];
      t0 = $[5];
    }
    t0 = y;
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2, cond2: false }],
};

```
      
### Eval output
(kind: ok) [2]
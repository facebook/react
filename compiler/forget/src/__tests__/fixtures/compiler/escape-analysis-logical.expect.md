
## Input

```javascript
function Component(props) {
  const a = [props.a];
  const b = [props.b];
  const c = [props.c];
  // We don't do constant folding for non-primitive values (yet) so we consider
  // that any of a, b, or c could return here
  return (a && b) || c;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(10);
  const c_0 = $[0] !== props.a;
  let t0;
  if (c_0) {
    t0 = [props.a];
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const a = t0;
  const c_2 = $[2] !== props.b;
  let t1;
  if (c_2) {
    t1 = [props.b];
    $[2] = props.b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const b = t1;
  const c_4 = $[4] !== props.c;
  let t2;
  if (c_4) {
    t2 = [props.c];
    $[4] = props.c;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const c = t2;
  const c_6 = $[6] !== a;
  const c_7 = $[7] !== b;
  const c_8 = $[8] !== c;
  let t3;
  if (c_6 || c_7 || c_8) {
    t3 = (a && b) || c;
    $[6] = a;
    $[7] = b;
    $[8] = c;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  return t3;
}

```
      
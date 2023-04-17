
## Input

```javascript
function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.push(42);
  const y = a.at(props.c);

  return { a, x, y };
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(11);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let t0;
  let a;
  if (c_0 || c_1) {
    a = [props.a, props.b, "hello"];
    t0 = a.push(42);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
    $[3] = a;
  } else {
    t0 = $[2];
    a = $[3];
  }
  const x = t0;
  const c_4 = $[4] !== a;
  const c_5 = $[5] !== props.c;
  let t1;
  if (c_4 || c_5) {
    t1 = a.at(props.c);
    $[4] = a;
    $[5] = props.c;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  const y = t1;
  const c_7 = $[7] !== a;
  const c_8 = $[8] !== x;
  const c_9 = $[9] !== y;
  let t2;
  if (c_7 || c_8 || c_9) {
    t2 = { a, x, y };
    $[7] = a;
    $[8] = x;
    $[9] = y;
    $[10] = t2;
  } else {
    t2 = $[10];
  }
  return t2;
}

```
      
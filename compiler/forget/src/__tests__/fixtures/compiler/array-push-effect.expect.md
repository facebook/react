
## Input

```javascript
// arrayInstance.push should have the following effects:
//  - read on all args (rest parameter)
//  - mutate on receiver
function Component(props) {
  const x = foo(props.x);
  const y = { y: props.y };
  const arr = [];
  arr.push({});
  arr.push(x, y);
  return arr;
}

```

## Code

```javascript
import * as React from "react"; // arrayInstance.push should have the following effects:
//  - read on all args (rest parameter)
//  - mutate on receiver
function Component(props) {
  const $ = React.unstable_useMemoCache(8);
  const c_0 = $[0] !== props.x;
  let t0;
  if (c_0) {
    t0 = foo(props.x);
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const c_2 = $[2] !== props.y;
  let t1;
  if (c_2) {
    t1 = { y: props.y };
    $[2] = props.y;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const y = t1;
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== y;
  let arr;
  if (c_4 || c_5) {
    arr = [];
    let t2;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = {};
      $[7] = t2;
    } else {
      t2 = $[7];
    }
    arr.push(t2);
    arr.push(x, y);
    $[4] = x;
    $[5] = y;
    $[6] = arr;
  } else {
    arr = $[6];
  }
  return arr;
}

```
      
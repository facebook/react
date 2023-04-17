
## Input

```javascript
// arrayInstance.at should have the following effects:
//  - read on arg0
//  - read on receiver
//  - mutate on lvalue
function ArrayAtTest(props) {
  const arr = [foo(props.x)];
  const result = arr.at(bar(props.y));
  return result;
}

```

## Code

```javascript
import * as React from "react"; // arrayInstance.at should have the following effects:
//  - read on arg0
//  - read on receiver
//  - mutate on lvalue
function ArrayAtTest(props) {
  const $ = React.unstable_useMemoCache(9);
  const c_0 = $[0] !== props.x;
  let t0;
  if (c_0) {
    t0 = foo(props.x);
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = [t0];
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const arr = t1;
  const c_4 = $[4] !== props.y;
  const c_5 = $[5] !== arr;
  let t3;
  if (c_4 || c_5) {
    const c_7 = $[7] !== props.y;
    let t2;
    if (c_7) {
      t2 = bar(props.y);
      $[7] = props.y;
      $[8] = t2;
    } else {
      t2 = $[8];
    }
    t3 = arr.at(t2);
    $[4] = props.y;
    $[5] = arr;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const result = t3;
  return result;
}

```
      
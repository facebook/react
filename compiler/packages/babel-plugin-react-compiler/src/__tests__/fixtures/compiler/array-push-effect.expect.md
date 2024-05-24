
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
import { c as _c } from "react/compiler-runtime"; // arrayInstance.push should have the following effects:
//  - read on all args (rest parameter)
//  - mutate on receiver
function Component(props) {
  const $ = _c(8);
  let t0;
  if ($[0] !== props.x || $[1] !== props.y) {
    const arr = [];

    t0 = arr;
    let t1;
    if ($[3] !== props.x) {
      t1 = foo(props.x);
      $[3] = props.x;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    const x = t1;
    let t2;
    if ($[5] !== props.y) {
      t2 = { y: props.y };
      $[5] = props.y;
      $[6] = t2;
    } else {
      t2 = $[6];
    }
    const y = t2;
    arr.push(x, y);
    let t3;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t3 = {};
      $[7] = t3;
    } else {
      t3 = $[7];
    }
    arr.push(t3);
    $[0] = props.x;
    $[1] = props.y;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      
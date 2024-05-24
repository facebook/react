
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
    let t2;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = {};
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    arr.push(t2);
    const x = t1;
    let t3;
    if ($[6] !== props.y) {
      t3 = { y: props.y };
      $[6] = props.y;
      $[7] = t3;
    } else {
      t3 = $[7];
    }
    const y = t3;
    arr.push(x, y);
    $[0] = props.x;
    $[1] = props.y;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      
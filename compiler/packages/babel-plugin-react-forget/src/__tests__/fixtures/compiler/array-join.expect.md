
## Input

```javascript
function Component(props) {
  const x = [{}, [], props.value];
  const y = x.join(() => "this closure gets stringified, not called");
  foo(y);
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(8);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const c_2 = $[2] !== props.value;
  let t2;
  if (c_2) {
    t2 = [t0, t1, props.value];
    $[2] = props.value;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const x = t2;
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => "this closure gets stringified, not called";
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const y = x.join(t3);
  foo(y);
  const c_5 = $[5] !== x;
  const c_6 = $[6] !== y;
  let t4;
  if (c_5 || c_6) {
    t4 = [x, y];
    $[5] = x;
    $[6] = y;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  return t4;
}

```
      
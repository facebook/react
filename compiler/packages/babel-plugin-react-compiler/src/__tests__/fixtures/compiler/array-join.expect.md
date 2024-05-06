
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
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(8);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  let t2;
  if ($[2] !== props.value) {
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
  let t4;
  if ($[5] !== x || $[6] !== y) {
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
      
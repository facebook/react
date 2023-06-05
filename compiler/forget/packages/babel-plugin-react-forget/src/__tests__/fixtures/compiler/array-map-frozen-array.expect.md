
## Input

```javascript
function Component(props) {
  const x = [];
  <dif>{x}</dif>;
  const y = x.map((item) => item);
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (item) => item;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    t2 = x.map(t1);
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const y = t2;
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = [x, y];
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}

```
      
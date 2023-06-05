
## Input

```javascript
function Component(props) {
  const x = [];
  const y = x.map((item) => {
    item.updated = true;
    return item;
  });
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  let t1;
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = (item) => {
        item.updated = true;
        return item;
      };
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    t1 = x.map(t0);
    $[0] = t1;
    $[1] = x;
  } else {
    t1 = $[0];
    x = $[1];
  }
  const y = t1;
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [x, y];
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      
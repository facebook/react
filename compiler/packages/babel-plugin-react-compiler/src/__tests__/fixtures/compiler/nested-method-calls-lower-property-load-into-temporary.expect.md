
## Input

```javascript
import {makeArray} from 'shared-runtime';

const other = [0, 1];
function Component({}) {
  const items = makeArray(0, 1, 2, null, 4, false, 6);
  const max = Math.max(2, items.push(5), ...other);
  return max;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { makeArray } from "shared-runtime";

const other = [0, 1];
function Component(t0) {
  const $ = _c(4);
  let t1;
  let t2;
  let t3;
  let t4;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const items = makeArray(0, 1, 2, null, 4, false, 6);
    t1 = Math;
    t2 = t1.max;
    t3 = 2;
    t4 = items.push(5);
    $[0] = t1;
    $[1] = t2;
    $[2] = t3;
    $[3] = t4;
  } else {
    t1 = $[0];
    t2 = $[1];
    t3 = $[2];
    t4 = $[3];
  }
  const max = t2(t3, t4, ...other);
  return max;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 8
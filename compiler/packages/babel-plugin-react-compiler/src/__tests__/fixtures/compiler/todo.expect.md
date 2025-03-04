
## Input

```javascript
import {makeArray} from 'shared-runtime';

function Component(props) {
  const items = makeArray(0, 1, 2, null, 4, false, 6);
  const max = Math.max(...items.filter(Boolean));
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

function Component(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const items = makeArray(0, 1, 2, null, 4, false, 6);
    t0 = Math.max(...items.filter(Boolean));
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const max = t0;
  return max;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 6
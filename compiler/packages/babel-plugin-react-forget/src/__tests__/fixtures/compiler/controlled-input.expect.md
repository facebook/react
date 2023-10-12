
## Input

```javascript
import { useState } from "react";
function component() {
  let [x, setX] = useState(0);
  const handler = (event) => setX(event.target.value);
  return <input onChange={handler} value={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: true,
};

```

## Code

```javascript
import { useState, unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(4);
  const [x, setX] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (event) => setX(event.target.value);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const handler = t0;
  let t1;
  if ($[1] !== handler || $[2] !== x) {
    t1 = <input onChange={handler} value={x} />;
    $[1] = handler;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: true,
};

```
      
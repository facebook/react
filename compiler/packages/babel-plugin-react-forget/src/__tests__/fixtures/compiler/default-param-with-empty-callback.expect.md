
## Input

```javascript
function Component(x = () => {}) {
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t0) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = t0 === undefined ? () => {} : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
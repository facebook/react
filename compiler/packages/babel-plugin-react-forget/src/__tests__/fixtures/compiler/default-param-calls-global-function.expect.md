
## Input

```javascript
import { identity } from "shared-runtime";

function Component(x = identity([() => {}, true, 42, "hello"])) {
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
import { identity } from "shared-runtime";

function Component(t0) {
  const $ = useMemoCache(2);
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? identity([() => {}, true, 42, "hello"]) : t0;
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
      
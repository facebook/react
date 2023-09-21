
## Input

```javascript
function hoisting() {
  const foo = () => {
    return bar();
  };
  const bar = () => {
    return 1;
  };

  return foo(); // OK: bar's value is only accessed outside of its TDZ
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function hoisting() {
  const $ = useMemoCache(2);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const foo = () => bar();
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = () => 1;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    const bar = t0;

    t1 = foo();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```
      
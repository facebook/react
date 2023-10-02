
## Input

```javascript
function hoisting() {
  const foo = () => {
    return bar + baz;
  };
  const bar = 3;
  const baz = 2;
  return foo(); // OK: called outside of TDZ for bar/baz
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
  let foo;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    foo = () => bar + baz;

    const bar = 3;
    const baz = 2;
    $[0] = foo;
  } else {
    foo = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = foo();
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```
      

## Input

```javascript
function Foo() {
  return (function t() {
    let x = {};
    return function a(x = () => {}) {
      return x;
    };
  })();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo() {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function t() {
      return function a(t25) {
        const x_0 = t25 === undefined ? () => {} : t25;
        return x_0;
      };
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = t0();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: false,
};

```
      
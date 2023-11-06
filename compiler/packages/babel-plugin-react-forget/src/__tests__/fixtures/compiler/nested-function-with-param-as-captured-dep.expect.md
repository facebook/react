
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
  const $ = useMemoCache(1);
  let t18;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function a(t28) {
      const x_0 = t28 === undefined ? () => {} : t28;
      return x_0;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  t18 = t0;
  return t18;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: false,
};

```
      
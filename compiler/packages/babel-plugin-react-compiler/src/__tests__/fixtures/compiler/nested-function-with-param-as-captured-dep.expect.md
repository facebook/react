
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
import { c as useMemoCache } from "react/compiler-runtime";
function Foo() {
  const $ = useMemoCache(1);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = function a(t2) {
      const x_0 = t2 === undefined ? () => {} : t2;
      return x_0;
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  t0 = t1;
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: false,
};

```
      
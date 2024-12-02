
## Input

```javascript
function Foo() {
  return (function t() {
    let x = {};
    let y = {};
    return function a(x = () => {}) {
      return (function b(y = []) {
        return [x, y];
      })();
    };
  })();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Foo() {
  const $ = _c(1);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = function a(t2) {
      const x_0 = t2 === undefined ? _temp : t2;
      return (function b(t3) {
        const y_0 = t3 === undefined ? [] : t3;
        return [x_0, y_0];
      })();
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  t0 = t1;
  return t0;
}
function _temp() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```
      
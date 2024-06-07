
## Input

```javascript
function component(a) {
  let t = { a };
  function x(p) {
    p.foo();
  }
  x(t);
  return t;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a) {
  const $ = _c(3);
  let t0;
  if ($[0] !== a) {
    const t = { a };

    t0 = t;
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = function x(p) {
        p.foo();
      };
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    const x = t1;
    x(t);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
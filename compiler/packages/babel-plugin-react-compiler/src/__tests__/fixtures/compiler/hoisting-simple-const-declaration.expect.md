
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
import { c as _c } from "react/compiler-runtime";
function hoisting() {
  const $ = _c(3);
  let bar;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    bar = 3;
    $[0] = bar;
  } else {
    bar = $[0];
  }
  let baz;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    baz = 2;
    $[1] = baz;
  } else {
    baz = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    const foo = () => bar + baz;
    t0 = foo();
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) 5
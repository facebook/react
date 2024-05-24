
## Input

```javascript
import { makeArray } from "shared-runtime";

function Component() {
  let x,
    y = (x = {});
  const foo = () => {
    x = makeArray();
  };
  foo();
  return [y, x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { makeArray } from "shared-runtime";

function Component() {
  const $ = _c(3);
  let x;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const y = (x = {});

    t0 = y;
    const foo = () => {
      x = makeArray();
    };
    foo();
    $[0] = x;
    $[1] = t0;
  } else {
    x = $[0];
    t0 = $[1];
  }
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [t0, x];
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [{},[]]
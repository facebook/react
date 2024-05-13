
## Input

```javascript
import { identity, invoke } from "shared-runtime";

function foo() {
  let x = 2;
  const fn1 = () => {
    const copy1 = (x = 3);
    return identity(copy1);
  };
  const fn2 = () => {
    const copy2 = (x = 4);
    return [invoke(fn1), copy2, identity(copy2)];
  };
  return invoke(fn2);
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity, invoke } from "shared-runtime";

function foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let x;
    x = 2;
    const fn1 = () => {
      const copy1 = (x = 3);
      return identity(copy1);
    };

    const fn2 = () => {
      const copy2 = (x = 4);
      return [invoke(fn1), copy2, identity(copy2)];
    };

    t0 = invoke(fn2);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
};

```
      
### Eval output
(kind: ok) [3,4,4]
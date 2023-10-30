
## Input

```javascript
import { invoke } from "shared-runtime";

function Foo() {
  const x = [{ value: 0 }, { value: 1 }, { value: 2 }];
  const foo = (param: number) => {
    return x[param].value;
  };

  return invoke(foo, 1);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { invoke } from "shared-runtime";

function Foo() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = [{ value: 0 }, { value: 1 }, { value: 2 }];
    const foo = (param) => x[param].value;

    t0 = invoke(foo, 1);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```
      
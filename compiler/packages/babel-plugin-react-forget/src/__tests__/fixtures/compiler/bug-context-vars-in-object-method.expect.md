
## Input

```javascript
import { identity } from "shared-runtime";

function Foo() {
  const CONSTANT = 1;
  const x = {
    foo() {
      return identity(CONSTANT);
    },
  };
  return x.foo();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

function Foo() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = {
      foo() {
        return identity(CONSTANT);
      },
    };

    t0 = x.foo();
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
      
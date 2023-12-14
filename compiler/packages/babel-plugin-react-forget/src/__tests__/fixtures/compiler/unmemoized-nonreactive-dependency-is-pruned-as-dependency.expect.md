
## Input

```javascript
import { mutate, useNoAlias } from "shared-runtime";

function Component(props) {
  // Here `x` cannot be memoized bc its mutable range spans a hook call:
  const x = [];
  useNoAlias();
  mutate(x);

  // However, `x` is non-reactive. It cannot semantically change, so we
  // exclude it as a dependency of the JSX element:
  return <div>{x}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { mutate, useNoAlias } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(1);

  const x = [];
  useNoAlias();
  mutate(x);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>{x}</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) <div></div>
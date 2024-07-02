
## Input

```javascript
// @disableMemoization
import { useMemo } from "react";

function Component({ a }) {
  let x = useMemo(() => [a], []);
  return <div>{x}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 42 }],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @disableMemoization
import { useMemo } from "react";

function Component(t0) {
  const $ = _c(3);
  const { a } = t0;
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [a];
    $[0] = t2;
  } else {
    t2 = $[0];
  }
  t1 = t2;
  const x = t1;
  let t3;
  if ($[1] !== x || true) {
    t3 = <div>{x}</div>;
    $[1] = x;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 42 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>42</div>
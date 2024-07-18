
## Input

```javascript
// @disableMemoizationForDebugging
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
import { c as _c } from "react/compiler-runtime"; // @disableMemoizationForDebugging
import { useMemo } from "react";

function Component(t0) {
  const $ = _c(2);
  const { a } = t0;
  const x = useMemo(() => [a], []);
  let t1;
  if ($[0] !== x || true) {
    t1 = <div>{x}</div>;
    $[0] = x;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 42 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>42</div>
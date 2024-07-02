
## Input

```javascript
// @disableMemoization
import { useMemo } from "react";

const w = 42;

function Component(a) {
  let x = useMemo(() => a.x, [a, w]);
  return <div>{x}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @disableMemoization
import { useMemo } from "react";

const w = 42;

function Component(a) {
  const $ = _c(5);
  const t0 = w;
  let t1;
  let t2;
  if ($[0] !== a || $[1] !== t0) {
    t2 = a.x;
    $[0] = a;
    $[1] = t0;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  t1 = t2;
  const x = t1;
  let t3;
  if ($[3] !== x || true) {
    t3 = <div>{x}</div>;
    $[3] = x;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>42</div>
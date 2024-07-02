
## Input

```javascript
// @enablePreserveExistingManualUseMemoAsScope
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
import { c as _c } from "react/compiler-runtime"; // @enablePreserveExistingManualUseMemoAsScope
import { useMemo } from "react";

function Component(t0) {
  const $ = _c(4);
  const { a } = t0;
  let t1;
  let t2;
  if ($[0] !== a) {
    t2 = [a];
    $[0] = a;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  t1 = t2;
  const x = t1;
  let t3;
  if ($[2] !== x) {
    t3 = <div>{x}</div>;
    $[2] = x;
    $[3] = t3;
  } else {
    t3 = $[3];
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
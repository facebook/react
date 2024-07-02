
## Input

```javascript
// @enablePreserveExistingManualUseMemoAsScope
import { useMemo } from "react";
let cur = 99;
function random(id) {
  "use no forget";
  cur = cur + 1;
  return cur;
}

export default function C(id) {
  const r = useMemo(() => random(id.id), [id.id]);
  const a = r + 1;
  return <>{a}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{ id: 1 }],
  sequentialRenders: [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePreserveExistingManualUseMemoAsScope
import { useMemo } from "react";
let cur = 99;
function random(id) {
  "use no forget";
  cur = cur + 1;
  return cur;
}

export default function C(id) {
  const $ = _c(4);
  let t0;
  let t1;
  if ($[0] !== id.id) {
    t1 = random(id.id);
    $[0] = id.id;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  const r = t0;
  const a = r + 1;
  let t2;
  if ($[2] !== a) {
    t2 = <>{a}</>;
    $[2] = a;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{ id: 1 }],
  sequentialRenders: [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
};

```
      
### Eval output
(kind: ok) 101
101
101
101
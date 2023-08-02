
## Input

```javascript
function ConstantPropagationBug() {
  const x = CONSTANT1;
  const createPhiNode = CONSTANT2 || 5;

  const getFoo = () => <Foo x={x} y={createPhiNode} />;

  return getFoo();
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function ConstantPropagationBug() {
  const $ = useMemoCache(2);

  const createPhiNode = CONSTANT2 || 5;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => <Foo x={CONSTANT1} y={createPhiNode} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const getFoo = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getFoo();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      
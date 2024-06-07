
## Input

```javascript
// @logger
import { useState } from "react";
import { identity, makeObject_Primitives, useHook } from "shared-runtime";

function Component() {
  const x = makeObject_Primitives();
  const x2 = makeObject_Primitives();
  useState(null);
  identity(x);
  identity(x2);

  const y = useHook();

  const z = [];

  for (let i = 0; i < 10; i++) {
    const obj = makeObject_Primitives();
    z.push(obj);
  }

  return [x, x2, y, z];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @logger
import { useState } from "react";
import { identity, makeObject_Primitives, useHook } from "shared-runtime";

function Component() {
  const $ = _c(5);
  const x = makeObject_Primitives();
  const x2 = makeObject_Primitives();
  useState(null);
  identity(x);
  identity(x2);

  const y = useHook();
  let z;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    z = [];
    for (let i = 0; i < 10; i++) {
      const obj = makeObject_Primitives();
      z.push(obj);
    }
    $[0] = z;
  } else {
    z = $[0];
  }
  let t0;
  if ($[1] !== x || $[2] !== x2 || $[3] !== y) {
    t0 = [x, x2, y, z];
    $[1] = x;
    $[2] = x2;
    $[3] = y;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":5,"column":0,"index":121},"end":{"line":22,"column":1,"index":431},"filename":"log-pruned-memoization.ts"},"fnName":"Component","memoSlots":5,"memoBlocks":2,"prunedMemoBlocks":2,"prunedMemoValues":3}
```
      
### Eval output
(kind: exception) Fixture not implemented
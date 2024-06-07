
## Input

```javascript
// @logger
import { useState } from "react";
import { identity, makeObject_Primitives, useHook } from "shared-runtime";

function Component() {
  // The scopes for x and x2 are interleaved, so this is one scope with two values
  const x = makeObject_Primitives();
  const x2 = makeObject_Primitives();
  useState(null);
  identity(x);
  identity(x2);

  // We create a scope for all call expressions, but prune those with hook calls
  // in this case it's _just_ a hook call, so we don't count this as pruned
  const y = useHook();

  const z = [];
  for (let i = 0; i < 10; i++) {
    // The scope for obj is pruned bc it's in a loop
    const obj = makeObject_Primitives();
    z.push(obj);
  }

  // Overall we expect two pruned scopes (for x+x2, and obj), with 3 pruned scope values.
  return [x, x2, y, z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

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

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":5,"column":0,"index":121},"end":{"line":26,"column":1,"index":813},"filename":"log-pruned-memoization.ts"},"fnName":"Component","memoSlots":5,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":2,"prunedMemoValues":3}
```
      
### Eval output
(kind: ok) [{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},[{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true},{"a":0,"b":"value1","c":true}]]
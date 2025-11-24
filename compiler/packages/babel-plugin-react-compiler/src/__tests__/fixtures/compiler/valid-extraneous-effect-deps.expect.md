
## Input

```javascript
// @loggerTestOnly @validateExtraneousEffectDependencies
import {useEffect, useLayoutEffect} from 'react';

function Component({a, b, x, y}) {
  // ok: all dependencies are used
  useEffect(() => {
    log(a, b);
  }, [a, b]);
  // ok: all dependencies are used
  useEffect(() => {
    log(a, b, b.c);
  }, [a, b, b.c]);
  // ok: no dependencies
  useEffect(() => {
    log('no deps');
  }, []);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateExtraneousEffectDependencies
import { useEffect, useLayoutEffect } from "react";

function Component(t0) {
  const $ = _c(9);
  const { a, b } = t0;
  let t1;
  let t2;
  if ($[0] !== a || $[1] !== b) {
    t1 = () => {
      log(a, b);
    };
    t2 = [a, b];
    $[0] = a;
    $[1] = b;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  let t4;
  if ($[4] !== a || $[5] !== b) {
    t3 = () => {
      log(a, b, b.c);
    };
    t4 = [a, b, b.c];
    $[4] = a;
    $[5] = b;
    $[6] = t3;
    $[7] = t4;
  } else {
    t3 = $[6];
    t4 = $[7];
  }
  useEffect(t3, t4);
  let t5;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = [];
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  useEffect(_temp, t5);
}
function _temp() {
  log("no deps");
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":108},"end":{"line":17,"column":1,"index":397},"filename":"valid-extraneous-effect-deps.ts"},"fnName":"Component","memoSlots":9,"memoBlocks":3,"memoValues":5,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented
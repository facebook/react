
## Input

```javascript
// @loggerTestOnly @validateExtraneousEffectDependencies
import {useEffect, useLayoutEffect} from 'react';

function Component({a, b, x, y}) {
  // error: `b` is not used in the effect
  useEffect(() => {
    log(a);
  }, [a, b]);
  // error: `x` and `y` are not used in the effect
  useEffect(() => {
    log('hello');
  }, [x, y]);
  // error: works with useLayoutEffect too
  useLayoutEffect(() => {
    log(a);
  }, [a, b]);
  // error: more precise dep
  useEffect(() => {
    log(a, b);
  }, [a, b.c]);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateExtraneousEffectDependencies
import { useEffect, useLayoutEffect } from "react";

function Component(t0) {
  const $ = _c(19);
  const { a, b, x, y } = t0;
  let t1;
  if ($[0] !== a) {
    t1 = () => {
      log(a);
    };
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== a || $[3] !== b) {
    t2 = [a, b];
    $[2] = a;
    $[3] = b;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== x || $[6] !== y) {
    t3 = [x, y];
    $[5] = x;
    $[6] = y;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  useEffect(_temp, t3);
  let t4;
  if ($[8] !== a) {
    t4 = () => {
      log(a);
    };
    $[8] = a;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== a || $[11] !== b) {
    t5 = [a, b];
    $[10] = a;
    $[11] = b;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  useLayoutEffect(t4, t5);
  let t6;
  if ($[13] !== a || $[14] !== b) {
    t6 = () => {
      log(a, b);
    };
    $[13] = a;
    $[14] = b;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  let t7;
  if ($[16] !== a || $[17] !== b.c) {
    t7 = [a, b.c];
    $[16] = a;
    $[17] = b.c;
    $[18] = t7;
  } else {
    t7 = $[18];
  }
  useEffect(t6, t7);
}
function _temp() {
  log("hello");
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"EffectDependencies","reason":"Found unnecessary effect dependencies","description":"Unnecessary dependencies can cause an effect to re-run more often than necessary, potentially causing performance issues","details":[{"kind":"error","message":"Unnecessary dependencies: `b`. These values are not referenced in the effect","loc":{"start":{"line":8,"column":5,"index":222},"end":{"line":8,"column":11,"index":228},"filename":"invalid-extraneous-effect-deps.ts"}}]}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"category":"EffectDependencies","reason":"Found unnecessary effect dependencies","description":"Unnecessary dependencies can cause an effect to re-run more often than necessary, potentially causing performance issues","details":[{"kind":"error","message":"Unnecessary dependencies: `x`, `y`. These values are not referenced in the effect","loc":{"start":{"line":12,"column":5,"index":325},"end":{"line":12,"column":11,"index":331},"filename":"invalid-extraneous-effect-deps.ts"}}]}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"category":"EffectDependencies","reason":"Found unnecessary effect dependencies","description":"Unnecessary dependencies can cause an effect to re-run more often than necessary, potentially causing performance issues","details":[{"kind":"error","message":"Unnecessary dependencies: `b`. These values are not referenced in the effect","loc":{"start":{"line":16,"column":5,"index":420},"end":{"line":16,"column":11,"index":426},"filename":"invalid-extraneous-effect-deps.ts"}}]}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"category":"EffectDependencies","reason":"Found unnecessary effect dependencies","description":"Unnecessary dependencies can cause an effect to re-run more often than necessary, potentially causing performance issues","details":[{"kind":"error","message":"Unnecessary dependencies: `b.c`. These values are not referenced in the effect","loc":{"start":{"line":20,"column":5,"index":498},"end":{"line":20,"column":13,"index":506},"filename":"invalid-extraneous-effect-deps.ts"}}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":108},"end":{"line":21,"column":1,"index":510},"filename":"invalid-extraneous-effect-deps.ts"},"fnName":"Component","memoSlots":19,"memoBlocks":7,"memoValues":7,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented
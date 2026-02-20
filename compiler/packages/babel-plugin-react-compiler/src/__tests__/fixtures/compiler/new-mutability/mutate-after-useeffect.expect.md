
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import {useEffect, AUTODEPS} from 'react';

function Component({foo}) {
  const arr = [];
  useEffect(() => {
    arr.push(foo);
  }, AUTODEPS);
  arr.push(2);
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import { useEffect, AUTODEPS } from "react";

function Component(t0) {
  const { foo } = t0;
  const arr = [];
  useEffect(() => {
    arr.push(foo);
  }, [arr, foo]);
  arr.push(2);
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ foo: 1 }],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"Immutability","reason":"This value cannot be modified","description":"Modifying a value used previously in an effect function or as an effect dependency is not allowed. Consider moving the modification before calling useEffect()","details":[{"kind":"error","loc":{"start":{"line":9,"column":2,"index":246},"end":{"line":9,"column":5,"index":249},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},"message":"value cannot be modified"}]}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"category":"Immutability","reason":"Cannot modify local variables after render completes","description":"This argument is a function which may reassign or mutate `arr` after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead","details":[{"kind":"error","loc":{"start":{"line":6,"column":12,"index":201},"end":{"line":8,"column":3,"index":231},"filename":"mutate-after-useeffect.ts"},"message":"This function may (indirectly) reassign or modify `arr` after render"},{"kind":"error","loc":{"start":{"line":7,"column":4,"index":213},"end":{"line":7,"column":7,"index":216},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},"message":"This modifies `arr`"}]}},"fnLoc":null}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":6,"column":2,"index":191},"end":{"line":8,"column":14,"index":242},"filename":"mutate-after-useeffect.ts"},"decorations":[{"start":{"line":7,"column":4,"index":213},"end":{"line":7,"column":7,"index":216},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},{"start":{"line":7,"column":4,"index":213},"end":{"line":7,"column":7,"index":216},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},{"start":{"line":7,"column":13,"index":222},"end":{"line":7,"column":16,"index":225},"filename":"mutate-after-useeffect.ts","identifierName":"foo"}]}
{"kind":"CompileError","fnLoc":{"start":{"line":4,"column":0,"index":143},"end":{"line":11,"column":1,"index":274},"filename":"mutate-after-useeffect.ts"},"detail":{"options":{"category":"Immutability","reason":"This value cannot be modified","description":"Modifying a value used previously in an effect function or as an effect dependency is not allowed. Consider moving the modification before calling useEffect()","details":[{"kind":"error","loc":{"start":{"line":9,"column":2,"index":246},"end":{"line":9,"column":5,"index":249},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},"message":"value cannot be modified"}]}}}
{"kind":"CompileError","fnLoc":{"start":{"line":4,"column":0,"index":143},"end":{"line":11,"column":1,"index":274},"filename":"mutate-after-useeffect.ts"},"detail":{"options":{"category":"Immutability","reason":"Cannot modify local variables after render completes","description":"This argument is a function which may reassign or mutate `arr` after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead","details":[{"kind":"error","loc":{"start":{"line":6,"column":12,"index":201},"end":{"line":8,"column":3,"index":231},"filename":"mutate-after-useeffect.ts"},"message":"This function may (indirectly) reassign or modify `arr` after render"},{"kind":"error","loc":{"start":{"line":7,"column":4,"index":213},"end":{"line":7,"column":7,"index":216},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},"message":"This modifies `arr`"}]}}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":6,"column":2,"index":191},"end":{"line":8,"column":14,"index":242},"filename":"mutate-after-useeffect.ts"},"decorations":[{"start":{"line":7,"column":4,"index":213},"end":{"line":7,"column":7,"index":216},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},{"start":{"line":7,"column":4,"index":213},"end":{"line":7,"column":7,"index":216},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},{"start":{"line":7,"column":13,"index":222},"end":{"line":7,"column":16,"index":225},"filename":"mutate-after-useeffect.ts","identifierName":"foo"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":143},"end":{"line":11,"column":1,"index":274},"filename":"mutate-after-useeffect.ts"},"fnName":"Component","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) [2]
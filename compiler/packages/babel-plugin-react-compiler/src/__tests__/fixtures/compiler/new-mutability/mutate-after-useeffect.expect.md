
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly
import {useEffect} from 'react';

function Component({foo}) {
  const arr = [];
  useEffect(() => {
    arr.push(foo);
  });
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
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly
import { useEffect } from "react";

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
{"kind":"CompileError","fnLoc":{"start":{"line":4,"column":0,"index":101},"end":{"line":11,"column":1,"index":222},"filename":"mutate-after-useeffect.ts"},"detail":{"reason":"This mutates a variable that React considers immutable","description":null,"loc":{"start":{"line":9,"column":2,"index":194},"end":{"line":9,"column":5,"index":197},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},"suggestions":null,"severity":"InvalidReact"}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":6,"column":2,"index":149},"end":{"line":8,"column":4,"index":190},"filename":"mutate-after-useeffect.ts"},"decorations":[{"start":{"line":7,"column":4,"index":171},"end":{"line":7,"column":7,"index":174},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},{"start":{"line":7,"column":4,"index":171},"end":{"line":7,"column":7,"index":174},"filename":"mutate-after-useeffect.ts","identifierName":"arr"},{"start":{"line":7,"column":13,"index":180},"end":{"line":7,"column":16,"index":183},"filename":"mutate-after-useeffect.ts","identifierName":"foo"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":101},"end":{"line":11,"column":1,"index":222},"filename":"mutate-after-useeffect.ts"},"fnName":"Component","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) [2]
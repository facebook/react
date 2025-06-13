
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly

import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

function Component({arrRef}) {
  // Avoid taking arr.current as a dependency
  useEffect(() => print(arrRef.current));
  arrRef.current.val = 2;
  return arrRef;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{arrRef: {current: {val: 'initial ref value'}}}],
};

```

## Code

```javascript
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly

import { useEffect, useRef } from "react";
import { print } from "shared-runtime";

function Component(t0) {
  const { arrRef } = t0;

  useEffect(() => print(arrRef.current), [arrRef]);
  arrRef.current.val = 2;
  return arrRef;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ arrRef: { current: { val: "initial ref value" } } }],
};

```

## Logs

```
{"kind":"CompileError","fnLoc":{"start":{"line":6,"column":0,"index":148},"end":{"line":11,"column":1,"index":311},"filename":"mutate-after-useeffect-ref-access.ts"},"detail":{"reason":"Mutating component props or hook arguments is not allowed. Consider using a local variable instead","description":null,"loc":{"start":{"line":9,"column":2,"index":269},"end":{"line":9,"column":16,"index":283},"filename":"mutate-after-useeffect-ref-access.ts"},"suggestions":null,"severity":"InvalidReact"}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":8,"column":2,"index":227},"end":{"line":8,"column":40,"index":265},"filename":"mutate-after-useeffect-ref-access.ts"},"decorations":[{"start":{"line":8,"column":24,"index":249},"end":{"line":8,"column":30,"index":255},"filename":"mutate-after-useeffect-ref-access.ts","identifierName":"arrRef"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":6,"column":0,"index":148},"end":{"line":11,"column":1,"index":311},"filename":"mutate-after-useeffect-ref-access.ts"},"fnName":"Component","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"current":{"val":2}}
logs: [{ val: 2 }]
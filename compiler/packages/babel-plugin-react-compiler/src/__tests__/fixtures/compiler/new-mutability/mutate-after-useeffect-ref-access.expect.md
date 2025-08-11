
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel

import {useEffect, useRef, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

function Component({arrRef}) {
  // Avoid taking arr.current as a dependency
  useEffect(() => print(arrRef.current), AUTODEPS);
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
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel

import { useEffect, useRef, AUTODEPS } from "react";
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
{"kind":"CompileError","fnLoc":{"start":{"line":6,"column":0,"index":190},"end":{"line":11,"column":1,"index":363},"filename":"mutate-after-useeffect-ref-access.ts"},"detail":{"options":{"severity":"InvalidReact","category":"Cannot access refs during render","description":"React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef)","details":[{"kind":"error","loc":{"start":{"line":9,"column":2,"index":321},"end":{"line":9,"column":16,"index":335},"filename":"mutate-after-useeffect-ref-access.ts"},"message":"Cannot update ref during render"}]}}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":8,"column":2,"index":269},"end":{"line":8,"column":50,"index":317},"filename":"mutate-after-useeffect-ref-access.ts"},"decorations":[{"start":{"line":8,"column":24,"index":291},"end":{"line":8,"column":30,"index":297},"filename":"mutate-after-useeffect-ref-access.ts","identifierName":"arrRef"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":6,"column":0,"index":190},"end":{"line":11,"column":1,"index":363},"filename":"mutate-after-useeffect-ref-access.ts"},"fnName":"Component","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"current":{"val":2}}
logs: [{ val: 2 }]
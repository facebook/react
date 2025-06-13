
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function Component({foo}) {
  const arr = [];
  // Taking either arr[0].value or arr as a dependency is reasonable
  // as long as developers know what to expect.
  useEffect(() => print(arr[0]?.value));
  arr.push({value: foo});
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 1}],
};

```

## Code

```javascript
// @inferEffectDependencies @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import { useEffect } from "react";
import { print } from "shared-runtime";

function Component(t0) {
  const { foo } = t0;
  const arr = [];

  useEffect(() => print(arr[0]?.value), [arr[0]?.value]);
  arr.push({ value: foo });
  return arr;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ foo: 1 }],
};

```

## Logs

```
{"kind":"CompileError","fnLoc":{"start":{"line":5,"column":0,"index":171},"end":{"line":12,"column":1,"index":416},"filename":"mutate-after-useeffect-optional-chain.ts"},"detail":{"reason":"Updating a value used previously in an effect function or as an effect dependency is not allowed. Consider moving the mutation before calling useEffect()","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":10,"column":2,"index":377},"end":{"line":10,"column":5,"index":380},"filename":"mutate-after-useeffect-optional-chain.ts","identifierName":"arr"}}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":9,"column":2,"index":336},"end":{"line":9,"column":39,"index":373},"filename":"mutate-after-useeffect-optional-chain.ts"},"decorations":[{"start":{"line":9,"column":24,"index":358},"end":{"line":9,"column":27,"index":361},"filename":"mutate-after-useeffect-optional-chain.ts","identifierName":"arr"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":5,"column":0,"index":171},"end":{"line":12,"column":1,"index":416},"filename":"mutate-after-useeffect-optional-chain.ts"},"fnName":"Component","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) [{"value":1}]
logs: [1]
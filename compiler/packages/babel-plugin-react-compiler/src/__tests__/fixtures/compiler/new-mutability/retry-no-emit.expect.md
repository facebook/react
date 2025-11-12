
## Input

```javascript
// @inferEffectDependencies @outputMode:"none" @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import {print} from 'shared-runtime';
import useEffectWrapper from 'useEffectWrapper';
import {AUTODEPS} from 'react';

function Foo({propVal}) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr), AUTODEPS);

  const arr2 = [];
  useEffectWrapper(() => arr2.push(propVal), AUTODEPS);
  arr2.push(2);
  return {arr, arr2};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{propVal: 1}],
  sequentialRenders: [{propVal: 1}, {propVal: 2}],
};

```

## Code

```javascript
// @inferEffectDependencies @outputMode:"none" @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import { print } from "shared-runtime";
import useEffectWrapper from "useEffectWrapper";
import { AUTODEPS } from "react";

function Foo({ propVal }) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr), AUTODEPS);

  const arr2 = [];
  useEffectWrapper(() => arr2.push(propVal), AUTODEPS);
  arr2.push(2);
  return { arr, arr2 };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ propVal: 1 }],
  sequentialRenders: [{ propVal: 1 }, { propVal: 2 }],
};

```

## Logs

```
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":8,"column":2,"index":291},"end":{"line":8,"column":46,"index":335},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":8,"column":31,"index":320},"end":{"line":8,"column":34,"index":323},"filename":"retry-no-emit.ts","identifierName":"arr"}]}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":11,"column":2,"index":359},"end":{"line":11,"column":54,"index":411},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":11,"column":25,"index":382},"end":{"line":11,"column":29,"index":386},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":25,"index":382},"end":{"line":11,"column":29,"index":386},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":35,"index":392},"end":{"line":11,"column":42,"index":399},"filename":"retry-no-emit.ts","identifierName":"propVal"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":6,"column":0,"index":238},"end":{"line":14,"column":1,"index":452},"filename":"retry-no-emit.ts"},"fnName":"Foo","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"arr":[1],"arr2":[2]}
{"arr":[2],"arr2":[2]}
logs: [[ 1 ],[ 2 ]]
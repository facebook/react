
## Input

```javascript
// @inferEffectDependencies @outputMode:"none" @panicThreshold:"none" @loggerTestOnly
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
// @inferEffectDependencies @outputMode:"none" @panicThreshold:"none" @loggerTestOnly
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
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":8,"column":2,"index":259},"end":{"line":8,"column":46,"index":303},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":8,"column":31,"index":288},"end":{"line":8,"column":34,"index":291},"filename":"retry-no-emit.ts","identifierName":"arr"}]}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":11,"column":2,"index":327},"end":{"line":11,"column":54,"index":379},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":11,"column":25,"index":350},"end":{"line":11,"column":29,"index":354},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":25,"index":350},"end":{"line":11,"column":29,"index":354},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":35,"index":360},"end":{"line":11,"column":42,"index":367},"filename":"retry-no-emit.ts","identifierName":"propVal"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":6,"column":0,"index":206},"end":{"line":14,"column":1,"index":420},"filename":"retry-no-emit.ts"},"fnName":"Foo","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"arr":[1],"arr2":[2]}
{"arr":[2],"arr2":[2]}
logs: [[ 1 ],[ 2 ]]
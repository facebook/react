
## Input

```javascript
// @inferEffectDependencies @noEmit @panicThreshold:"none" @loggerTestOnly
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
// @inferEffectDependencies @noEmit @panicThreshold:"none" @loggerTestOnly
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
{"kind":"CompileError","fnLoc":{"start":{"line":6,"column":0,"index":195},"end":{"line":14,"column":1,"index":409},"filename":"retry-no-emit.ts"},"detail":{"options":{"severity":"InvalidReact","category":"This value cannot be modified","description":"Modifying a value previously passed as an argument to a hook is not allowed. Consider moving the modification before calling the hook.","details":[{"kind":"error","loc":{"start":{"line":12,"column":2,"index":372},"end":{"line":12,"column":6,"index":376},"filename":"retry-no-emit.ts","identifierName":"arr2"},"message":"value cannot be modified"}]}}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":8,"column":2,"index":248},"end":{"line":8,"column":46,"index":292},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":8,"column":31,"index":277},"end":{"line":8,"column":34,"index":280},"filename":"retry-no-emit.ts","identifierName":"arr"}]}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":11,"column":2,"index":316},"end":{"line":11,"column":54,"index":368},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":11,"column":25,"index":339},"end":{"line":11,"column":29,"index":343},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":25,"index":339},"end":{"line":11,"column":29,"index":343},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":35,"index":349},"end":{"line":11,"column":42,"index":356},"filename":"retry-no-emit.ts","identifierName":"propVal"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":6,"column":0,"index":195},"end":{"line":14,"column":1,"index":409},"filename":"retry-no-emit.ts"},"fnName":"Foo","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"arr":[1],"arr2":[2]}
{"arr":[2],"arr2":[2]}
logs: [[ 1 ],[ 2 ]]
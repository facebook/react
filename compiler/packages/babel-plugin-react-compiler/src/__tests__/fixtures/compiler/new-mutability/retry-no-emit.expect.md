
## Input

```javascript
// @inferEffectDependencies @noEmit @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
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
// @inferEffectDependencies @noEmit @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
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
{"kind":"CompileError","detail":{"options":{"severity":"InvalidReact","category":"This value cannot be modified","description":"Modifying a value previously passed as an argument to a hook is not allowed. Consider moving the modification before calling the hook.","details":[{"kind":"error","loc":{"start":{"line":12,"column":2,"index":404},"end":{"line":12,"column":6,"index":408},"filename":"retry-no-emit.ts","identifierName":"arr2"},"message":"value cannot be modified"}]}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"severity":"InvalidReact","category":"Cannot modify local variables after render completes","description":"This argument is a function which may reassign or mutate `arr2` after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead.","details":[{"kind":"error","loc":{"start":{"line":11,"column":19,"index":365},"end":{"line":11,"column":43,"index":389},"filename":"retry-no-emit.ts"},"message":"This function may (indirectly) reassign or modify `arr2` after render"},{"kind":"error","loc":{"start":{"line":11,"column":25,"index":371},"end":{"line":11,"column":29,"index":375},"filename":"retry-no-emit.ts","identifierName":"arr2"},"message":"This modifies `arr2`"}]}},"fnLoc":null}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":8,"column":2,"index":280},"end":{"line":8,"column":46,"index":324},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":8,"column":31,"index":309},"end":{"line":8,"column":34,"index":312},"filename":"retry-no-emit.ts","identifierName":"arr"}]}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":11,"column":2,"index":348},"end":{"line":11,"column":54,"index":400},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":11,"column":25,"index":371},"end":{"line":11,"column":29,"index":375},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":25,"index":371},"end":{"line":11,"column":29,"index":375},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":11,"column":35,"index":381},"end":{"line":11,"column":42,"index":388},"filename":"retry-no-emit.ts","identifierName":"propVal"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":6,"column":0,"index":227},"end":{"line":14,"column":1,"index":441},"filename":"retry-no-emit.ts"},"fnName":"Foo","memoSlots":9,"memoBlocks":5,"memoValues":5,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"arr":[1],"arr2":[2]}
{"arr":[2],"arr2":[2]}
logs: [[ 1 ],[ 2 ]]
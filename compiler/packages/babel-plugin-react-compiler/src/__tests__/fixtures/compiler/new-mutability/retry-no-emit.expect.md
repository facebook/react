
## Input

```javascript
// @inferEffectDependencies @noEmit @panicThreshold:"none" @loggerTestOnly @enableNewMutationAliasingModel
import {print} from 'shared-runtime';
import useEffectWrapper from 'useEffectWrapper';

function Foo({propVal}) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr));

  const arr2 = [];
  useEffectWrapper(() => arr2.push(propVal));
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

function Foo({ propVal }) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr));

  const arr2 = [];
  useEffectWrapper(() => arr2.push(propVal));
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
{"kind":"CompileError","fnLoc":{"start":{"line":5,"column":0,"index":195},"end":{"line":13,"column":1,"index":389},"filename":"retry-no-emit.ts"},"detail":{"reason":"Updating a value previously passed as an argument to a hook is not allowed. Consider moving the mutation before calling the hook","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":11,"column":2,"index":352},"end":{"line":11,"column":6,"index":356},"filename":"retry-no-emit.ts","identifierName":"arr2"}}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":7,"column":2,"index":248},"end":{"line":7,"column":36,"index":282},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":7,"column":31,"index":277},"end":{"line":7,"column":34,"index":280},"filename":"retry-no-emit.ts","identifierName":"arr"}]}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":10,"column":2,"index":306},"end":{"line":10,"column":44,"index":348},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":10,"column":25,"index":329},"end":{"line":10,"column":29,"index":333},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":10,"column":25,"index":329},"end":{"line":10,"column":29,"index":333},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":10,"column":35,"index":339},"end":{"line":10,"column":42,"index":346},"filename":"retry-no-emit.ts","identifierName":"propVal"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":5,"column":0,"index":195},"end":{"line":13,"column":1,"index":389},"filename":"retry-no-emit.ts"},"fnName":"Foo","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"arr":[1],"arr2":[2]}
{"arr":[2],"arr2":[2]}
logs: [[ 1 ],[ 2 ]]
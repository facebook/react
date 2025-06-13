
## Input

```javascript
// @inferEffectDependencies @noEmit @panicThreshold:"none" @loggerTestOnly
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
// @inferEffectDependencies @noEmit @panicThreshold:"none" @loggerTestOnly
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
{"kind":"CompileError","fnLoc":{"start":{"line":5,"column":0,"index":163},"end":{"line":13,"column":1,"index":357},"filename":"retry-no-emit.ts"},"detail":{"reason":"This mutates a variable that React considers immutable","description":null,"loc":{"start":{"line":11,"column":2,"index":320},"end":{"line":11,"column":6,"index":324},"filename":"retry-no-emit.ts","identifierName":"arr2"},"suggestions":null,"severity":"InvalidReact"}}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":7,"column":2,"index":216},"end":{"line":7,"column":36,"index":250},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":7,"column":31,"index":245},"end":{"line":7,"column":34,"index":248},"filename":"retry-no-emit.ts","identifierName":"arr"}]}
{"kind":"AutoDepsDecorations","fnLoc":{"start":{"line":10,"column":2,"index":274},"end":{"line":10,"column":44,"index":316},"filename":"retry-no-emit.ts"},"decorations":[{"start":{"line":10,"column":25,"index":297},"end":{"line":10,"column":29,"index":301},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":10,"column":25,"index":297},"end":{"line":10,"column":29,"index":301},"filename":"retry-no-emit.ts","identifierName":"arr2"},{"start":{"line":10,"column":35,"index":307},"end":{"line":10,"column":42,"index":314},"filename":"retry-no-emit.ts","identifierName":"propVal"}]}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":5,"column":0,"index":163},"end":{"line":13,"column":1,"index":357},"filename":"retry-no-emit.ts"},"fnName":"Foo","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) {"arr":[1],"arr2":[2]}
{"arr":[2],"arr2":[2]}
logs: [[ 1 ],[ 2 ]]
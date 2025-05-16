
## Input

```javascript
// @dynamicGating:{"source":"shared-runtime"} @validatePreserveExistingMemoizationGuarantees @panicThreshold:"none" @loggerTestOnly

import {useMemo} from 'react';
import {identity} from 'shared-runtime';

function Foo({value}) {
  'use memo if(getTrue)';

  const initialValue = useMemo(() => identity(value), []);
  return (
    <>
      <div>initial value {initialValue}</div>
      <div>current value {value}</div>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{value: 1}],
  sequentialRenders: [{value: 1}, {value: 2}],
};

```

## Code

```javascript
// @dynamicGating:{"source":"shared-runtime"} @validatePreserveExistingMemoizationGuarantees @panicThreshold:"none" @loggerTestOnly

import { useMemo } from "react";
import { identity } from "shared-runtime";

function Foo({ value }) {
  "use memo if(getTrue)";

  const initialValue = useMemo(() => identity(value), []);
  return (
    <>
      <div>initial value {initialValue}</div>
      <div>current value {value}</div>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ value: 1 }],
  sequentialRenders: [{ value: 1 }, { value: 2 }],
};

```

## Logs

```
{"kind":"CompileError","fnLoc":{"start":{"line":6,"column":0,"index":206},"end":{"line":16,"column":1,"index":433},"filename":"dynamic-gating-bailout-nopanic.ts"},"detail":{"reason":"React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected","description":"The inferred dependency was `value`, but the source dependencies were []. Inferred dependency not present in source","severity":"CannotPreserveMemoization","suggestions":null,"loc":{"start":{"line":9,"column":31,"index":288},"end":{"line":9,"column":52,"index":309},"filename":"dynamic-gating-bailout-nopanic.ts"}}}
```
      
### Eval output
(kind: ok) <div>initial value 1</div><div>current value 1</div>
<div>initial value 1</div><div>current value 2</div>
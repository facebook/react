
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

function Component({propValue, onChange}) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(propValue);
    onChange();
  }, [propValue]);

  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propValue: 'test', onChange: () => {}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(7);
  const { propValue, onChange } = t0;
  const [value, setValue] = useState(null);
  let t1;
  if ($[0] !== onChange || $[1] !== propValue) {
    t1 = () => {
      setValue(propValue);
      onChange();
    };
    $[0] = onChange;
    $[1] = propValue;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== propValue) {
    t2 = [propValue];
    $[3] = propValue;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== value) {
    t3 = <div>{value}</div>;
    $[5] = value;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propValue: "test", onChange: () => {} }],
};

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":107},"end":{"line":12,"column":1,"index":306},"filename":"effect-contains-prop-function-call-no-error.ts"},"fnName":"Component","memoSlots":7,"memoBlocks":3,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":16,"column":41,"index":402},"end":{"line":16,"column":49,"index":410},"filename":"effect-contains-prop-function-call-no-error.ts"},"fnName":null,"memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>test</div>

## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

function Component({propValue}) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(propValue);
    globalCall();
  }, [propValue]);

  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propValue: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(5);
  const { propValue } = t0;
  const [value, setValue] = useState(null);
  let t1;
  let t2;
  if ($[0] !== propValue) {
    t1 = () => {
      setValue(propValue);
      globalCall();
    };
    t2 = [propValue];
    $[0] = propValue;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] !== value) {
    t3 = <div>{value}</div>;
    $[3] = value;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propValue: "test" }],
};

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":107},"end":{"line":12,"column":1,"index":298},"filename":"effect-with-global-function-call-no-error.ts"},"fnName":"Component","memoSlots":5,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) globalCall is not defined
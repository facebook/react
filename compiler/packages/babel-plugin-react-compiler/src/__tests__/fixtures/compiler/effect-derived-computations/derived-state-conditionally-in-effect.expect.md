
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

function Component({value, enabled}) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (enabled) {
      setLocalValue(value);
    } else {
      setLocalValue('disabled');
    }
  }, [value, enabled]);

  return <div>{localValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test', enabled: true}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(6);
  const { value, enabled } = t0;
  const [localValue, setLocalValue] = useState("");
  let t1;
  let t2;
  if ($[0] !== enabled || $[1] !== value) {
    t1 = () => {
      if (enabled) {
        setLocalValue(value);
      } else {
        setLocalValue("disabled");
      }
    };

    t2 = [value, enabled];
    $[0] = enabled;
    $[1] = value;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] !== localValue) {
    t3 = <div>{localValue}</div>;
    $[4] = localValue;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "test", enabled: true }],
};

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":107},"end":{"line":16,"column":1,"index":378},"filename":"derived-state-conditionally-in-effect.ts"},"fnName":"Component","memoSlots":6,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>test</div>
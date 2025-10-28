
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

import {useEffect, useState} from 'react';

function Component({shouldChange}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (shouldChange) {
      setCount(count + 1);
    }
  }, [count]);

  return <div>{count}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(7);
  const { shouldChange } = t0;
  const [count, setCount] = useState(0);
  let t1;
  if ($[0] !== count || $[1] !== shouldChange) {
    t1 = () => {
      if (shouldChange) {
        setCount(count + 1);
      }
    };
    $[0] = count;
    $[1] = shouldChange;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== count) {
    t2 = [count];
    $[3] = count;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== count) {
    t3 = <div>{count}</div>;
    $[5] = count;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":5,"column":0,"index":108},"end":{"line":15,"column":1,"index":310},"filename":"derived-state-from-local-state-in-effect.ts"},"fnName":"Component","memoSlots":7,"memoBlocks":3,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented
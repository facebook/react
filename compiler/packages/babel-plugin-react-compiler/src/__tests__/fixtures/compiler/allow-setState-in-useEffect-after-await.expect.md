
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import {useCallback, useEffect, useState} from 'react';

function Component() {
  const [ready, setReady] = useState(false);
  const f = useCallback(async () => {
    await fetch('...');
    setReady(true);
  }, []);

  useEffect(() => {
    f();
  }, [f]);

  return ready;
}

```

## Code

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import { useCallback, useEffect, useState } from "react";

function Component() {
  const [ready, setReady] = useState(false);
  const f = useCallback(async () => {
    await fetch("...");
    setReady(true);
  }, []);

  useEffect(() => {
    f();
  }, [f]);

  return ready;
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":124},"end":{"line":16,"column":1,"index":343},"filename":"allow-setState-in-useEffect-after-await.ts"},"fnName":"Component","memoSlots":3,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented